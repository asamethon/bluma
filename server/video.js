// Hikâye videosu: doğrula → MODERASYONDAN geçir → 720p'ye indir → poster üret.
//
// Sıra bilinçli: pahalı transcode, kareler nsfwjs'ten geçmeden ÇALIŞMAZ.
// Reddedilen video hiç diske yazılmaz, yalnızca geçici dizinde kalır ve silinir.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ffmpegExclusive, ffprobe } from './ffmpeg.js';
import { MediaError, mediaBasename, withTempDir, writeMedia } from './files.js';
import { checkImage } from './nsfw.js';

export const VIDEO_MAX_BYTES = Number(process.env.VIDEO_MAX_BYTES || 50 * 1024 * 1024);
const MAX_SECONDS = Number(process.env.VIDEO_MAX_SECONDS || 20);
const MODERATION_FRAMES = 5;
const POSTER_WIDTH = 1000;

// Uzun kenarı 1280'e sığdır (yatayda 1280x720, dikeyde 720x1280), sonra
// kenarları çifte yuvarla — libx264 tek sayılı boyut kabul etmez. `min(…,iw)`
// küçük kaynağı BÜYÜTMEZ: seçici videoyu zaten 540p'ye indirmiş olabilir.
const SCALE = "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease,"
  + 'scale=trunc(iw/2)*2:trunc(ih/2)*2';

async function probe(file) {
  const raw = await ffprobe([
    '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file,
  ]);
  const data = JSON.parse(raw || '{}');
  return {
    seconds: Number(data.format?.duration || 0),
    hasVideo: (data.streams || []).some((stream) => stream.codec_type === 'video'),
  };
}

/** Süre boyunca eşit aralıklı kareler; tek çözme geçişinde çıkar. */
async function moderateFrames(dir, file, seconds) {
  const fps = (MODERATION_FRAMES / Math.max(seconds, 1)).toFixed(4);
  await ffmpegExclusive([
    '-y', '-i', file, '-vf', `fps=${fps},scale=320:-2`,
    '-frames:v', String(MODERATION_FRAMES), '-q:v', '4', path.join(dir, 'frame-%02d.jpg'),
  ]);

  const frames = fs.readdirSync(dir).filter((name) => name.startsWith('frame-')).sort();
  for (const name of frames) {
    const verdict = await checkImage(fs.readFileSync(path.join(dir, name)));
    if (verdict?.explicit) {
      throw new MediaError(451, 'explicit_content', JSON.stringify(verdict.score));
    }
  }
  return frames.length;
}

async function buildPoster(dir, mp4) {
  const jpg = path.join(dir, 'poster.jpg');
  await ffmpegExclusive(['-y', '-ss', '0.5', '-i', mp4, '-frames:v', '1', '-q:v', '2', jpg]);
  // 0,5 sn'den kısa klipte arama boş döner: ilk kareye geri dön.
  if (!fs.existsSync(jpg)) {
    await ffmpegExclusive(['-y', '-i', mp4, '-frames:v', '1', '-q:v', '2', jpg]);
  }
  return sharp(fs.readFileSync(jpg))
    .resize({ width: POSTER_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Döner: `{ video, poster, frames, bytes }`. Fırlatılan `MediaError` istemciye
 * olduğu gibi (durum + kod) ulaşır; 451 moderasyon reddidir.
 */
export async function processVideo(buffer) {
  if (buffer.length > VIDEO_MAX_BYTES) {
    throw new MediaError(413, 'video_too_large', `${buffer.length} bayt`);
  }

  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input');
    fs.writeFileSync(input, buffer);

    const { seconds, hasVideo } = await probe(input);
    if (!hasVideo) throw new MediaError(415, 'unsupported_video', 'video akışı yok');
    // Bir saniye tolerans: seçicinin süre sınırı yuvarlayarak kesiyor.
    if (seconds > MAX_SECONDS + 1) {
      throw new MediaError(413, 'video_too_long', `${seconds.toFixed(1)} sn`);
    }

    const frames = await moderateFrames(dir, input, seconds);

    const mp4 = path.join(dir, 'out.mp4');
    await ffmpegExclusive([
      '-y', '-i', input, '-t', String(MAX_SECONDS), '-vf', SCALE,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
      '-maxrate', '2M', '-bufsize', '4M', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
      // Konum ve cihaz bilgisini at: yazarın videosu üstveri sızdırmasın.
      '-map_metadata', '-1', mp4,
    ]);

    const poster = await buildPoster(dir, mp4);
    const base = mediaBasename();
    const encoded = fs.readFileSync(mp4);
    return {
      video: writeMedia('video', `${base}.mp4`, encoded),
      poster: writeMedia('video', `${base}.webp`, poster),
      frames,
      bytes: encoded.length,
    };
  });
}
