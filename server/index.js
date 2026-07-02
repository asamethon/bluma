// Bluma görsel servisi.
//
// Uygulama, görselleri base64 olarak Firestore dokümanlarına gömmek yerine
// buraya yükler; Firestore'da yalnızca dönen URL saklanır. Kimlik doğrulama
// Firebase ID token'ı ile yapılır (service account gerekmez — token, Google'ın
// açık JWKS anahtarlarıyla doğrulanır).
//
// Endpoint'ler:
//   POST /upload?kind=profile|cover|comment   (Authorization: Bearer <idToken>,
//                                              multipart alan adı: "image")
//     → { "url": "https://.../i/cover/<id>.webp" }
//   GET  /i/<kind>/<file>                      (1 yıl immutable cache)
//   GET  /health
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import multer from 'multer';
import sharp from 'sharp';

const PORT = Number(process.env.PORT || 8788);
// Yalnızca loopback'i dinle — dış dünyaya nginx/reverse proxy konuşur.
const HOST = process.env.HOST || '127.0.0.1';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'bluma-dc10e';
// Dönen URL'lerin taban adresi (Caddy/nginx arkasındaki genel adres).
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// Tür başına çıktı ayarları — hepsi webp'e çevrilir (expo-image destekler).
const KINDS = {
  profile: { width: 512, quality: 80 },
  cover: { width: 900, quality: 80 },
  comment: { width: 800, quality: 75 },
};

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function verifyFirebaseToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    return payload.sub || null; // Firebase uid
  } catch {
    return null;
  }
}

const app = express();
app.set('trust proxy', 1); // Caddy/nginx arkasında gerçek IP için

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20, // kullanıcı başına değil IP başına; normal kullanım için bol
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/upload', uploadLimiter, upload.single('image'), async (req, res) => {
  const uid = await verifyFirebaseToken(req);
  if (!uid) return res.status(401).json({ error: 'unauthorized' });

  const kind = KINDS[req.query.kind] ? String(req.query.kind) : 'comment';
  const cfg = KINDS[kind];
  if (!req.file?.buffer?.length) return res.status(400).json({ error: 'no image' });

  try {
    const processed = await sharp(req.file.buffer)
      .rotate() // EXIF yönünü uygula
      .resize({ width: cfg.width, withoutEnlargement: true })
      .webp({ quality: cfg.quality })
      .toBuffer();

    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;
    const dir = path.join(DATA_DIR, kind);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), processed);

    console.log(`upload ok: uid=${uid} kind=${kind} in=${req.file.buffer.length}B out=${processed.length}B → ${name}`);
    return res.json({ url: `${PUBLIC_BASE_URL}/i/${kind}/${name}` });
  } catch (err) {
    console.error('upload error:', err);
    return res.status(422).json({ error: 'invalid image' });
  }
});

// İşlenmiş görseller içerik-değişmez dosyalardır → agresif cache güvenli.
app.use('/i', express.static(DATA_DIR, {
  immutable: true,
  maxAge: '365d',
  fallthrough: false,
}));

app.listen(PORT, HOST, () => {
  console.log(`bluma-image-server listening on ${HOST}:${PORT} (project: ${FIREBASE_PROJECT_ID})`);
  console.log(`public base url: ${PUBLIC_BASE_URL}, data dir: ${DATA_DIR}`);
});
