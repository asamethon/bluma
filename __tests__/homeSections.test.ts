import {
  buildHomeSections,
  localDayNumber,
  toMillis,
  type HomeSection,
  type HomeSectionsInput,
} from '@/features/home/services/homeSections';
import type { Story } from '@/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 9, 10, 12).getTime();

const story = (id: string, overrides: Partial<Story> = {}) => ({
  id,
  authorId: `author-${id}`,
  likesCount: 0,
  commentsCount: 0,
  viewsCount: 0,
  createdAt: new Date(NOW - DAY),
  ...overrides,
}) as Story;

const build = (overrides: Partial<HomeSectionsInput> = {}) => buildHomeSections({
  pool: [],
  continueReading: [],
  following: [],
  recommend: () => [],
  now: NOW,
  ...overrides,
});

const idsOf = (section: HomeSection) => (
  section.layout === 'continue' ? section.entries.map(entry => entry.story.id) : section.stories.map(item => item.id)
);
const find = (sections: HomeSection[], key: string) => sections.find(section => section.key === key);

describe('buildHomeSections', () => {
  const pool = Array.from({ length: 30 }, (_, index) => story(`s${index}`, {
    likesCount: 30 - index,
    viewsCount: index * 3,
    createdAt: new Date(NOW - index * DAY),
  }));

  it('bir hikâye ana sayfada yalnızca bir kez görünür', () => {
    const sections = build({
      pool,
      continueReading: [{ story: pool[0], chapterIndex: 2 }],
      following: [pool[1], pool[2]],
      recommend: candidates => candidates.slice(0, 5),
    });
    const all = sections.flatMap(idsOf);
    expect(new Set(all).size).toBe(all.length);
  });

  it('Okumaya Devam Et en fazla 3 hikâye gösterir ve onları diğer bölümlerden çıkarır', () => {
    const continueReading = pool.slice(0, 5).map(item => ({ story: item, chapterIndex: 0 }));
    const sections = build({ pool, continueReading, recommend: candidates => candidates });
    expect(idsOf(sections[0])).toEqual(['s0', 's1', 's2']);
    const rest = sections.slice(1).flatMap(idsOf);
    expect(rest).not.toContain('s0');
    expect(rest).not.toContain('s2');
  });

  it('editör seçimi yalnızca işaretli hikâyelerden gelir', () => {
    expect(find(build({ pool }), 'editors_pick')).toBeUndefined();
    const picked = pool.map(item => (item.id === 's7' ? { ...item, isEditorsPick: true } : item));
    expect(idsOf(find(build({ pool: picked }), 'editors_pick')!)).toEqual(['s7']);
  });

  it('birden fazla editör seçimi günden güne sırayla döner', () => {
    const picked = pool.map(item => (['s3', 's4'].includes(item.id) ? { ...item, isEditorsPick: true } : item));
    const today = idsOf(find(build({ pool: picked, now: NOW }), 'editors_pick')!)[0];
    const tomorrow = idsOf(find(build({ pool: picked, now: NOW + DAY }), 'editors_pick')!)[0];
    expect(today).not.toBe(tomorrow);
  });

  it('eşiğin altında kalan raf gösterilmez', () => {
    const small = [story('a', { likesCount: 5 }), story('b', { likesCount: 3 })];
    expect(find(build({ pool: small }), 'popular_now')).toBeUndefined();
  });

  it('takip rafı tek hikâyeyle bile görünür ve en yeniyi öne alır', () => {
    const older = story('old', { createdAt: new Date(NOW - 5 * DAY) });
    const newer = story('new', { createdAt: new Date(NOW - DAY) });
    expect(idsOf(find(build({ following: [older] }), 'following')!)).toEqual(['old']);
    expect(idsOf(find(build({ following: [older, newer] }), 'following')!)).toEqual(['new', 'old']);
  });

  it('kişisel öneri yalnızca henüz kullanılmamış adayları görür', () => {
    const seen: string[][] = [];
    build({
      pool,
      continueReading: [{ story: pool[0], chapterIndex: 0 }],
      following: [pool[1]],
      recommend: candidates => {
        seen.push(candidates.map(item => item.id));
        return candidates.slice(0, 3);
      },
    });
    expect(seen[0]).not.toContain('s0');
    expect(seen[0]).not.toContain('s1');
  });

  it('hiç hikâye yoksa boş liste döner', () => {
    expect(build()).toEqual([]);
  });
});

describe('toMillis', () => {
  it('Timestamp, Date, metin ve sayıyı milisaniyeye çevirir', () => {
    expect(toMillis({ toMillis: () => 42 })).toBe(42);
    expect(toMillis({ toDate: () => new Date(43) })).toBe(43);
    expect(toMillis(new Date(44))).toBe(44);
    expect(toMillis('1970-01-01T00:00:00.045Z')).toBe(45);
    expect(toMillis(46)).toBe(46);
  });

  it('geçersiz değerde 0 döner', () => {
    expect(toMillis(undefined)).toBe(0);
    expect(toMillis('tarih değil')).toBe(0);
  });
});

describe('localDayNumber', () => {
  it('aynı yerel gün içinde sabit, ertesi gün bir artar', () => {
    const morning = new Date(2026, 9, 10, 0, 5).getTime();
    const night = new Date(2026, 9, 10, 23, 55).getTime();
    expect(localDayNumber(morning)).toBe(localDayNumber(night));
    expect(localDayNumber(night + 10 * 60 * 1000)).toBe(localDayNumber(night) + 1);
  });
});
