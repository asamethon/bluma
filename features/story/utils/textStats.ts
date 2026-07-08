// Metin istatistikleri — kelime/karakter/okuma süresi. Resim belirteçlerini
// (\n[[img:URL]]\n) saymaz, yoksa yalnızca resim ekleyip hiç metin yazmayan
// bir kullanıcı yanlışlıkla yayınlama eşiğini geçmiş görünür.
import { stripImageTokens } from './imageToken';

const WORDS_PER_MINUTE = 200;

export function wordCount(text: string): number {
  const t = stripImageTokens(text).trim();
  return t ? t.split(/\s+/).length : 0;
}

export function charCount(text: string): number {
  return stripImageTokens(text).length;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.ceil(wordCount(text) / WORDS_PER_MINUTE));
}
