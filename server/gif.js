// Hikâye GIF'i: kare örnekle → MODERASYONDAN geçir → animasyonlu webp üret.
//
// Çıktının webp olması bilinçli: token `[[img:…webp]]` olarak kaldığı için
// mağazadaki 3.0.x istemciler de animasyonu expo-image ile oynatır.
import sharp from 'sharp';
import { MediaError, mediaBasename, writeMedia } from './files.js';
import { checkImage } from './nsfw.js';

export const GIF_MAX_BYTES = Number(process.env.GIF_MAX_BYTES || 12 * 1024 * 1024);
const MAX_FRAMES = 400;
const MODERATION_SAMPLES = 4;
const OUT_WIDTH = 480;

/** Karelerden eşit aralıklı örnek: ilk kare temiz olup sonrası olmayabilir. */
const samplePages = (pages, count) => [
  ...new Set(Array.from({ length: Math.min(count, pages) }, (_, index) =>
    Math.floor((pages * (index + 0.5)) / Math.min(count, pages)))),
].filter((page) => page < pages);

export async function processGif(buffer) {
  if (buffer.length > GIF_MAX_BYTES) {
    throw new MediaError(413, 'gif_too_large', `${buffer.length} bayt`);
  }

  let meta;
  try {
    meta = await sharp(buffer, { animated: true }).metadata();
  } catch {
    throw new MediaError(415, 'unsupported_gif', 'okunamayan dosya');
  }
  const pages = meta.pages || 1;
  if (pages > MAX_FRAMES) throw new MediaError(413, 'gif_too_long', `${pages} kare`);

  for (const page of samplePages(pages, MODERATION_SAMPLES)) {
    const frame = await sharp(buffer, { page }).removeAlpha().jpeg({ quality: 80 }).toBuffer();
    const verdict = await checkImage(frame);
    if (verdict?.explicit) {
      throw new MediaError(451, 'explicit_content', JSON.stringify(verdict.score));
    }
  }

  const encoded = await sharp(buffer, { animated: true })
    .resize({ width: OUT_WIDTH, withoutEnlargement: true })
    .webp({ quality: 70, effort: 4 })
    .toBuffer();

  return {
    url: writeMedia('gif', `${mediaBasename()}.webp`, encoded),
    pages,
    bytes: encoded.length,
  };
}
