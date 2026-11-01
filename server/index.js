// Bluma medya servisi.
//
// Uygulama, medyayı base64 olarak Firestore dokümanlarına gömmek yerine buraya
// yükler; Firestore'da yalnızca dönen URL saklanır. Kimlik doğrulama Firebase
// ID token'ı ile yapılır (bkz. auth.js).
//
// Endpoint'ler (hepsi Authorization: Bearer <idToken>):
//   POST /upload?kind=profile|cover|comment|content  (multipart alan adı "image")
//     → { "url": "https://.../i/cover/<id>.webp" }
//   POST /upload-voice   (alan adı "file", m4a/AAC)  → { "url": ".../i/voice/<id>.m4a" }
//   POST /upload-gif     (alan adı "file", gif)      → { "url": ".../i/gif/<id>.webp" }
//   POST /upload-video   (alan adı "file", mp4/mov)
//     → { "video": ".../i/video/<id>.mp4", "poster": ".../i/video/<id>.webp" }
//   GET  /i/<kind>/<file>   (1 yıl immutable cache)
//   GET  /health
//
// Moderasyon: görsel, GIF (kare örnekleme) ve video (kare çıkarma) nsfwjs'ten
// geçer; explicit içerik HTTP 451 ile reddedilir ve diske YAZILMAZ.
import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import { FIREBASE_PROJECT_ID, verifyFirebaseToken } from './auth.js';
import { DATA_DIR, MediaError, PUBLIC_BASE_URL, mediaBasename, writeMedia } from './files.js';
import { GIF_MAX_BYTES, processGif } from './gif.js';
import { checkImage, loadNsfwModel } from './nsfw.js';
import { VIDEO_MAX_BYTES, processVideo } from './video.js';
import { processVoice } from './voice.js';

const PORT = Number(process.env.PORT || 8788);
// Yalnızca loopback'i dinle — dış dünyaya nginx/reverse proxy konuşur.
const HOST = process.env.HOST || '127.0.0.1';

// Tür başına çıktı ayarları — hepsi webp'e çevrilir (expo-image destekler).
const KINDS = {
  profile: { width: 512, quality: 80 },
  cover: { width: 900, quality: 80 },
  comment: { width: 800, quality: 75 },
  content: { width: 1000, quality: 80 },
};

const app = express();
app.set('trust proxy', 1); // Caddy/nginx arkasında gerçek IP için

const bodyLimit = (maxBytes) => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes, files: 1 },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20, // kullanıcı başına değil IP başına; normal kullanım için bol
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/upload', uploadLimiter, bodyLimit(15 * 1024 * 1024).single('image'), async (req, res) => {
  const uid = await verifyFirebaseToken(req);
  if (!uid) return res.status(401).json({ error: 'unauthorized' });

  const kind = KINDS[req.query.kind] ? String(req.query.kind) : 'comment';
  const cfg = KINDS[kind];
  if (!req.file?.buffer?.length) return res.status(400).json({ error: 'no image' });

  // NSFW moderasyonu: explicit görseli diske yazmadan reddet. 451 = içerik
  // politikası reddi (client bunu base64 fallback'e DÜŞMEDEN kullanıcıya gösterir).
  try {
    const verdict = await checkImage(req.file.buffer);
    if (verdict?.explicit) {
      console.warn(`upload rejected (explicit): uid=${uid} kind=${kind} score=${JSON.stringify(verdict.score)}`);
      return res.status(451).json({ error: 'explicit_content', message: 'Bu görsel topluluk kurallarına uygun değil.' });
    }
  } catch (err) {
    // Kontrol hatası olursa fail-open: yüklemeye devam et, reaktif moderasyon yakalar.
    console.error('nsfw check error:', err?.message || err);
  }

  try {
    const processed = await sharp(req.file.buffer)
      .rotate() // EXIF yönünü uygula
      .resize({ width: cfg.width, withoutEnlargement: true })
      .webp({ quality: cfg.quality })
      .toBuffer();

    const url = writeMedia(kind, `${mediaBasename()}.webp`, processed);
    console.log(`upload ok: uid=${uid} kind=${kind} in=${req.file.buffer.length}B out=${processed.length}B`);
    return res.json({ url });
  } catch (err) {
    console.error('upload error:', err);
    return res.status(422).json({ error: 'invalid image' });
  }
});

/**
 * Ses/GIF/video uçları aynı iskeleti paylaşır: kimlik → gövde → işleyici.
 * İşleyicinin fırlattığı `MediaError` durum kodu ve kodla istemciye geçer;
 * 451 moderasyon reddidir ve istemci bunu kullanıcıya gösterir.
 */
const mediaRoute = (label, process, maxBytes) => [
  uploadLimiter,
  bodyLimit(maxBytes).single('file'),
  async (req, res) => {
    const uid = await verifyFirebaseToken(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    if (!req.file?.buffer?.length) return res.status(400).json({ error: 'no file' });

    try {
      const result = await process(req.file.buffer);
      console.log(`${label} ok: uid=${uid} in=${req.file.buffer.length}B ${JSON.stringify(result)}`);
      return res.json(result);
    } catch (err) {
      if (err instanceof MediaError) {
        const level = err.status === 451 ? 'warn' : 'error';
        console[level](`${label} rejected (${err.code}): uid=${uid} ${err.message}`);
        return res.status(err.status).json({ error: err.code });
      }
      console.error(`${label} error:`, err);
      return res.status(500).json({ error: 'processing failed' });
    }
  },
];

app.post('/upload-voice', ...mediaRoute('voice', processVoice, 6 * 1024 * 1024));
app.post('/upload-gif', ...mediaRoute('gif', processGif, GIF_MAX_BYTES));
app.post('/upload-video', ...mediaRoute('video', processVideo, VIDEO_MAX_BYTES));

// İşlenmiş medya içerik-değişmez dosyalardır → agresif cache güvenli.
app.use('/i', express.static(DATA_DIR, {
  immutable: true,
  maxAge: '365d',
  fallthrough: false,
}));

// Multer'ın boyut sınırı aşımı 500 değil 413 dönmeli: istemci "çok büyük"
// mesajını gösterebilsin.
app.use((err, _req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'file_too_large' });
  return next(err);
});

// NSFW modelini açılışta ısıt (indirme bir kereliktir), sonra dinlemeye başla.
// Model yüklenemese bile (loadNsfwModel fırlatmaz) sunucu ayağa kalkar.
loadNsfwModel().finally(() => {
  app.listen(PORT, HOST, () => {
    console.log(`bluma-image-server listening on ${HOST}:${PORT} (project: ${FIREBASE_PROJECT_ID})`);
    console.log(`public base url: ${PUBLIC_BASE_URL}, data dir: ${DATA_DIR}`);
  });
});
