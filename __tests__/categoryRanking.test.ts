import { CategoryMeta } from '@/constants/categories';
import {
  categoryEntries,
  sortByCategorySort,
  storyVelocity,
} from '@/features/home/services/categoryRanking';
import type { Story } from '@/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 10, 1, 12).getTime();

const story = (id: string, overrides: Partial<Story> = {}) => ({
  id,
  title: `Hikâye ${id}`,
  category: 'romance',
  authorId: `author-${id}`,
  likesCount: 0,
  commentsCount: 0,
  viewsCount: 0,
  createdAt: new Date(NOW - DAY),
  ...overrides,
}) as Story;

describe('storyVelocity', () => {
  it('aynı etkileşimde yeni hikâye eskisini geçer', () => {
    const fresh = story('fresh', { viewsCount: 100, createdAt: new Date(NOW - 2 * DAY) });
    const old = story('old', { viewsCount: 100, createdAt: new Date(NOW - 200 * DAY) });
    expect(storyVelocity(fresh, NOW)).toBeGreaterThan(storyVelocity(old, NOW));
  });

  it('oy ve yorum okumadan ağır basar', () => {
    const read = story('read', { viewsCount: 20 });
    const voted = story('voted', { likesCount: 3 });
    const discussed = story('discussed', { commentsCount: 3 });
    expect(storyVelocity(voted, NOW)).toBeGreaterThan(storyVelocity(read, NOW));
    expect(storyVelocity(discussed, NOW)).toBeGreaterThan(storyVelocity(voted, NOW));
  });
});

describe('sortByCategorySort', () => {
  // Wattpad'in Hot listesi toplam sayıya değil günlük hıza bakar: eski ama
  // durmuş bir hikâye, yeni ve ilgi gören bir hikâyenin altında kalır.
  const stale = story('stale', { viewsCount: 1000, createdAt: new Date(NOW - 300 * DAY) });
  const active = story('active', { viewsCount: 60, likesCount: 4, createdAt: new Date(NOW - 3 * DAY) });
  const brandNew = story('new', { createdAt: new Date(NOW - 1000) });

  it('hot: toplam okumayı değil günlük hızı sıralar', () => {
    const ids = sortByCategorySort([stale, active, brandNew], 'hot', NOW).map(item => item.id);
    expect(ids[0]).toBe('active');
    expect(ids).toContain('stale');
  });

  it('rising: yalnız son 30 günde yayınlananları gösterir', () => {
    const ids = sortByCategorySort([stale, active, brandNew], 'rising', NOW).map(item => item.id);
    expect(ids).not.toContain('stale');
    expect(ids[0]).toBe('active');
  });

  it('new: en yeni başa gelir', () => {
    const ids = sortByCategorySort([stale, active, brandNew], 'new', NOW).map(item => item.id);
    expect(ids).toEqual(['new', 'active', 'stale']);
  });
});

describe('categoryEntries', () => {
  it('bütün türleri sayısıyla verir, boş tür de listelenir', () => {
    const entries = categoryEntries([
      story('a', { category: 'horror' }),
      story('b', { category: 'horror' }),
      story('c', { category: 'romance' }),
    ]);
    expect(entries).toHaveLength(Object.keys(CategoryMeta).length);
    expect(entries[0]).toEqual({ id: 'horror', count: 2 });
    expect(entries.find(entry => entry.id === 'poetry')).toEqual({ id: 'poetry', count: 0 });
  });
});
