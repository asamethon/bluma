import type { Story } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OfflineChapter = { title?: string; content: string };
export type OfflineStory = Story & { downloadedAt: Date; size: number };

const STORIES_KEY = '@bluma_offline_stories';
const CHAPTERS_PREFIX = '@bluma_offline_chapters';
// Eski sürümler indirme yüzdesini de kalıcı depoya yazıyordu; yüzde artık
// yalnızca store'da yaşıyor, kalan anahtarlar temizlikte süpürülüyor.
const LEGACY_PROGRESS_PREFIX = '@bluma_download_progress';

/** Çevrimdışı kitaplığın üst sınırı (KB). */
export const MAX_STORAGE_KB = 500 * 1024;

const chaptersKey = (storyId: string) => `${CHAPTERS_PREFIX}_${storyId}`;

// Bozuk/eksik kayıt tüm kitaplığı düşürmesin diye tek noktada tolere edilir.
function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function readOfflineStories(): Promise<OfflineStory[]> {
  const raw = await AsyncStorage.getItem(STORIES_KEY).catch(() => null);
  return parse<OfflineStory[]>(raw, []).map(story => ({
    ...story,
    downloadedAt: new Date(story.downloadedAt),
  }));
}

export async function readOfflineChapter(storyId: string, index: number): Promise<OfflineChapter | null> {
  const raw = await AsyncStorage.getItem(chaptersKey(storyId)).catch(() => null);
  return parse<OfflineChapter[]>(raw, [])[index] ?? null;
}

export async function saveOfflineStory(story: OfflineStory, chapters?: OfflineChapter[]): Promise<void> {
  if (chapters?.length) {
    await AsyncStorage.setItem(chaptersKey(story.id), JSON.stringify(chapters));
  }
  const stored = await readOfflineStories();
  await AsyncStorage.setItem(
    STORIES_KEY,
    JSON.stringify([...stored.filter(item => item.id !== story.id), story]),
  );
}

export async function removeOfflineStory(storyId: string): Promise<void> {
  const stored = await readOfflineStories();
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stored.filter(item => item.id !== storyId)));
  await AsyncStorage.removeItem(chaptersKey(storyId)).catch(() => {});
}

export async function removeAllOfflineData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter(
    key => key === STORIES_KEY || key.startsWith(CHAPTERS_PREFIX) || key.startsWith(LEGACY_PROGRESS_PREFIX),
  );
  if (stale.length) await AsyncStorage.multiRemove(stale);
}

/** UTF-16 karakter sayısından yaklaşık KB boyutu (metadata payı dahil). */
export function measureStory(story: Story, chapters?: OfflineChapter[]): number {
  const body = chapters?.length
    ? chapters.reduce((total, chapter) => total + chapter.content.length, 0)
    : story.content?.length ?? 0;
  const characters = body + (story.title?.length ?? 0) + (story.description?.length ?? 0);
  return Math.ceil((characters * 2 + 1024) / 1024);
}
