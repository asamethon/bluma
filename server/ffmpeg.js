// ffmpeg/ffprobe sarmalayıcısı. Girdi KULLANICIDAN gelir: her çağrı zaman
// sınırlı, tek seferde yalnızca bir transcode çalışır (VPS 2 çekirdek —
// paralel transcode nsfwjs'i ve görsel servisini aç bırakır).
import { spawn } from 'node:child_process';
import { MediaError } from './files.js';

const TIMEOUT_MS = Number(process.env.FFMPEG_TIMEOUT_MS || 90_000);

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: TIMEOUT_MS,
      killSignal: 'SIGKILL',
    });
    const chunks = { out: '', err: '' };
    child.stdout.on('data', (chunk) => { chunks.out += chunk; });
    child.stderr.on('data', (chunk) => { chunks.err += chunk.toString().slice(-2000); });
    child.on('error', (err) => reject(
      err.code === 'ENOENT'
        ? new MediaError(503, 'ffmpeg_missing', `${bin} kurulu değil (apt install ffmpeg)`)
        : err,
    ));
    child.on('close', (code) => (code === 0
      ? resolve(chunks.out)
      : reject(new MediaError(422, 'ffmpeg_failed', `${bin} çıkış ${code}: ${chunks.err.slice(-400)}`))));
  });
}

export const ffprobe = (args) => run('ffprobe', args);

// Tek sıra: transcode'lar birbirini beklesin. Önceki iş hata verse de sıra akar.
const queue = { chain: Promise.resolve() };

export function ffmpegExclusive(args) {
  const task = () => run('ffmpeg', args);
  const result = queue.chain.then(task, task);
  queue.chain = result.then(() => undefined, () => undefined);
  return result;
}
