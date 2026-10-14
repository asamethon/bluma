import type { Story } from '@/types';

/**
 * Raf (beğenilenler, kaydedilenler, Okumaya Devam Et) için bellek içi hikâye
 * önbelleği. Firestore'dan okunan her hikâye buraya düşer; raflar aynı
 * hikâyeyi 10 dakika içinde tekrar okumaz.
 *
 * Bilerek yalnızca raflarda kullanılır: okuyucu ve düzenleme ekranları her
 * zaman sunucudan okur (eski başlık/içerikle düzenleme riski olmasın). Rafta
 * sayaçların birkaç dakika geride kalması kabul edilebilir.
 */
const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { story: Story; at: number }>();

export function rememberStory(story: Story, now = Date.now()) {
  cache.set(story.id, { story, at: now });
}

export function cachedStory(storyId: string, now = Date.now()): Story | null {
  const hit = cache.get(storyId);
  return hit && now - hit.at < TTL_MS ? hit.story : null;
}

export function forgetStory(storyId?: string) {
  if (storyId) cache.delete(storyId);
  else cache.clear();
}
