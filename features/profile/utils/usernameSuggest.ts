import { USERNAME_MAX_LENGTH, normalizeUsername } from '@/features/auth/utils/usernameNormalize';
import { assessUsername } from './usernameAssess';

/** Görünen adı kelimelere böler; noktalama ve emoji normalleştirmede düşer. */
const WORD_SEPARATOR = /[\s.,_\-/\\|;:]+/;

const MIN_LENGTH = 3;
const MAX_SUGGESTIONS = 3;

/** 30 karakter sınırına kırp ve kesme yüzünden kalan alt çizgiyi at. */
const fit = (value: string) => value.slice(0, USERNAME_MAX_LENGTH).replace(/_+$/, '');

/**
 * Görünen addan en fazla 3 kullanıcı adı adayı üretir:
 * "Gökçe Yılmaz" → ["gokceyilmaz", "gokce_yilmaz", "gokce"].
 *
 * 3 karakterden kısa, mevcut adla aynı ya da `assessUsername`'in gürültülü
 * bulduğu adaylar elenir — kullanıcıya kötü bir adı önermeyiz. Aday süzgeci
 * `displayName` vermeden çağrılır: burada "bu kişinin kendi adı" muafiyeti
 * istemiyoruz, aday gerçekten temiz olmalı.
 */
export function suggestUsernames(displayName: string, current = ''): string[] {
  const words = (displayName || '').trim().split(WORD_SEPARATOR).map(normalizeUsername).filter(Boolean);
  if (!words.length) return [];
  const candidates = [fit(words.join('')), fit(words.join('_')), words[0]];
  const seen = new Set([normalizeUsername(current)]);
  const picked: string[] = [];
  for (const candidate of candidates) {
    if (candidate.length < MIN_LENGTH || seen.has(candidate)) continue;
    seen.add(candidate);
    if (assessUsername(candidate).flagged) continue;
    picked.push(candidate);
    if (picked.length === MAX_SUGGESTIONS) break;
  }
  return picked;
}
