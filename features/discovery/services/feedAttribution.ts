import type { FeedSource } from '../constants';

/**
 * "Bu okuma nereden geldi?" eşlemesi. Vitrinde bir karta dokunulduğunda
 * kaynak hikâye kimliğiyle not edilir; önizleme → okuyucu geçişinde rota
 * parametresi taşımaya gerek kalmadan `story_read` / `chapter_read` olayları
 * bu kaynağı `src` olarak alır.
 *
 * Saf modüldür (Firebase içermez) ki test edilebilsin.
 */
const TTL_MS = 30 * 60 * 1000;
const sources = new Map<string, { source: FeedSource; at: number }>();

export function rememberSource(storyId: string, source: FeedSource, now = Date.now()) {
  sources.set(storyId, { source, at: now });
}

/** Son 30 dakikada bir vitrinden açılmadıysa `direct` (bildirim, derin bağlantı, profil...). */
export function readSource(storyId: string, now = Date.now()): FeedSource | 'direct' {
  const entry = sources.get(storyId);
  if (!entry || now - entry.at > TTL_MS) return 'direct';
  return entry.source;
}

export function resetSources() {
  sources.clear();
}
