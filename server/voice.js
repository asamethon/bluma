// Sesli mesaj. Görsel hattından geçmez: sharp yok, NSFW kontrolü yok (ses),
// dosya olduğu gibi saklanır. Tür kontrolü uzantıya değil, MPEG-4 kutu
// imzasına ("ftyp", 4.-8. bayt) bakar — istemcinin bildirdiği mime'a güvenilmez.
import { MediaError, mediaBasename, writeMedia } from './files.js';

const VOICE_MAX_BYTES = 6 * 1024 * 1024; // ~2 dk / 64 kbps AAC

const isMpeg4Audio = (buffer) =>
  buffer.length > 12 && buffer.subarray(4, 8).toString('latin1') === 'ftyp';

export async function processVoice(buffer) {
  if (buffer.length > VOICE_MAX_BYTES) {
    throw new MediaError(413, 'audio_too_large', `${buffer.length} bayt`);
  }
  if (!isMpeg4Audio(buffer)) {
    throw new MediaError(415, 'unsupported_audio_type', 'ftyp imzası yok');
  }
  return { url: writeMedia('voice', `${mediaBasename()}.m4a`, buffer), bytes: buffer.length };
}
