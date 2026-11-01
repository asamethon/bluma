import { CategoryMeta } from '@/constants/categories';
import type { Story } from '@/types';
import { toMillis } from './homeSections';

/** Bir tür sayfasındaki sıralama seçenekleri (Wattpad'deki Hot / Rising / New). */
export type CategorySort = 'hot' | 'rising' | 'new';
export const CATEGORY_SORTS: CategorySort[] = ['hot', 'rising', 'new'];

const DAY = 24 * 60 * 60 * 1000;
const RISING_WINDOW = 30 * DAY;

/**
 * Wattpad'in "Hot" listesinin bilinen davranışı: sıralama toplam sayıya değil
 * GÜNLÜK HIZA bakar — okuma/gün, oy/gün, yorum/gün. Bir zamanlar popüler olup
 * duran hikâye listeden düşer; yeni ve ilgi gören hikâye yükselir. Oy ve yorum
 * okumadan çok daha ağır basar, çünkü okuma pasif, oy ve yorum niyet gösterir.
 */
export function storyVelocity(story: Story, now = Date.now()): number {
  const days = Math.max(1, (now - toMillis(story.createdAt)) / DAY);
  const engagement = (story.viewsCount || 0)
    + (story.likesCount || 0) * 10
    + (story.commentsCount || 0) * 20;
  return engagement / days;
}

const newestFirst = (left: Story, right: Story) => toMillis(right.createdAt) - toMillis(left.createdAt);

/**
 * `hot`: günlük hıza göre. `rising`: son 30 günde yayınlananlar arasında hız —
 * yeni yazara vitrin açan liste. `new`: en yeni.
 */
export function sortByCategorySort(stories: Story[], sort: CategorySort, now = Date.now()): Story[] {
  if (sort === 'new') return [...stories].sort(newestFirst);
  const byVelocity = (left: Story, right: Story) => storyVelocity(right, now) - storyVelocity(left, now);
  if (sort === 'rising') {
    return stories.filter(story => now - toMillis(story.createdAt) <= RISING_WINDOW).sort(byVelocity);
  }
  return [...stories].sort(byVelocity);
}

export type CategoryEntry = { id: string; count: number };

/**
 * Bütün türler, hikâye sayısıyla. Boş tür de listelenir: katalog küçükken
 * okurun hangi türlerin var olduğunu görmesi, dolu rafları görmesinden önemli.
 */
export function categoryEntries(stories: Story[]): CategoryEntry[] {
  const counts = new Map<string, number>();
  for (const story of stories) {
    if (!story.category) continue;
    counts.set(story.category, (counts.get(story.category) ?? 0) + 1);
  }
  return Object.keys(CategoryMeta)
    .map(id => ({ id, count: counts.get(id) ?? 0 }))
    .sort((left, right) => right.count - left.count);
}
