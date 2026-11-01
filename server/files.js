// Diske yazma ve genel adres üretimi — yükleme uçlarının ortak zemini.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
export const PUBLIC_BASE_URL = (
  process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8788}`
).replace(/\/$/, '');

/**
 * Bir medyanın parçaları (video ve posteri) AYNI adı paylaşır: istemci
 * token'da yalnızca posteri taşır, videoyu uzantıyı değiştirerek bulur
 * (bkz. features/story/utils/mediaToken.ts).
 */
export const mediaBasename = () => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

export function writeMedia(kind, name, buffer) {
  const dir = path.join(DATA_DIR, kind);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buffer);
  return `${PUBLIC_BASE_URL}/i/${kind}/${name}`;
}

/** Geçici çalışma alanı: ffmpeg aranabilir bir girdi dosyası ister. */
export async function withTempDir(task) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluma-media-'));
  try {
    return await task(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Yükleme hatalarını HTTP durumuyla birlikte taşır. */
export class MediaError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}
