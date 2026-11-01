import {
  buildHomeSections,
  type HomeSection,
  type HomeSectionsInput,
} from '@/features/home/services/homeSections';
import { localDayNumber } from '@/features/home/services/storyOrder';
import { toMillis } from '@/utils/time';
import type { Story } from '@/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 9, 10, 12).getTime();

// Vitrin eşiği yalnızca adı şart koşuyor; kapak sıralamayı etkiler, elemez.
const story = (id: string, overrides: Partial<Story> = {}) => ({
  id,
  title: `Hikâye ${id}`,
  coverImage: `https://ornek/${id}.webp`,
  authorId: `author-${id}`,
  likesCount: 0,
  commentsCount: 0,
  viewsCount: 0,
  createdAt: new Date(NOW - DAY),
  ...overrides,
}) as Story;

const feed = (overrides: Partial<HomeSectionsInput> = {}) => buildHomeSections({
  pool: [],
  continueReading: [],
  following: [],
  recommend: () => [],
  now: NOW,
  ...overrides,
});
const build = (overrides: Partial<HomeSectionsInput> = {}) => feed(overrides).sections;

const idsOf = (section: HomeSection): string[] => {
  if (section.layout === 'continue') return section.entries.map(entry => entry.story.id);
  if (section.layout === 'categories') return section.categories.map(entry => entry.id);
  return section.stories.map(item => item.id);
};
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

  // Canlıda görülen sorun: üretken bir yazar bir bölümü tek başına dolduruyordu
  // ("Yeni Geldi" üst üste aynı şairin beş şiiri). Bkz. docs/KESFET-ALGORITMASI.md §0.5.
  it('aynı yazar bir rafı dolduramaz', () => {
    const pool = [
      ...Array.from({ length: 8 }, (_, index) => story(`p${index}`, {
        authorId: 'tek-yazar', viewsCount: 100 - index,
      })),
      ...Array.from({ length: 3 }, (_, index) => story(`d${index}`, { viewsCount: 50 - index })),
    ];
    const ids = idsOf(find(build({ pool }), 'popular_now')!);
    expect(ids.filter(id => id.startsWith('p'))).toHaveLength(2);
    expect(ids).toContain('d0');
  });

  it('Yeni Geldi aynı yazardan tek kart alır ve türü dağıtır', () => {
    const pool = [
      ...Array.from({ length: 4 }, (_, index) => story(`sair${index}`, {
        authorId: 'sair', category: 'poetry' as Story['category'],
        createdAt: new Date(NOW - index * 1000),
      })),
      story('roman', { authorId: 'romanci', category: 'romance' as Story['category'],
        createdAt: new Date(NOW - 5000) }),
      story('gizem', { authorId: 'gizemci', category: 'mystery' as Story['category'],
        createdAt: new Date(NOW - 6000) }),
    ];
    const ids = idsOf(find(build({ pool }), 'new_arrivals')!);
    expect(ids.filter(id => id.startsWith('sair'))).toHaveLength(1);
    expect(ids).toEqual(['sair0', 'roman', 'gizem']);
  });

  // Kapak artık eleme ölçütü değil (eskiden `requireCover` rafa hiç almıyordu):
  // kart rafa girer, yalnızca satırın sonuna iner.
  it('kapağı olmayan hikâye rafa girer ama satırın sonunda durur', () => {
    const pool = [
      story('kapaksiz', { coverImage: undefined, viewsCount: 999 }),
      ...Array.from({ length: 4 }, (_, index) => story(`k${index}`, { viewsCount: 10 - index })),
    ];
    const ids = idsOf(find(build({ pool }), 'popular_now')!);
    expect(ids).toContain('kapaksiz');
    expect(ids[ids.length - 1]).toBe('kapaksiz');
  });

  it('başlıksız hikâye hiçbir bölümde görünmez', () => {
    const pool = [
      story('adsiz', { title: '   ', viewsCount: 999 }),
      ...Array.from({ length: 4 }, (_, index) => story(`b${index}`, { viewsCount: 10 - index })),
    ];
    const result = feed({ pool });
    const everything = [...result.sections.flatMap(idsOf), ...result.rest.map(item => item.id)];
    expect(everything).not.toContain('adsiz');
  });

  it('hiç hikâye yoksa boş liste döner', () => {
    expect(feed()).toEqual({ sections: [], rest: [] });
  });
});

// Ana sayfanın sonu yok: rafların dışında kalan her hikâye kuyruğa düşer.
describe('sonsuz kuyruk (rest)', () => {
  // Tür ızgarası hikâye değil tür kimliği taşır; kuyruk karşılaştırmasına girmez.
  const storyIds = (sections: HomeSection[]) =>
    sections.flatMap(section => (section.layout === 'categories' ? [] : idsOf(section)));

  it('rafların almadığı her hikâye kuyruğa düşer, hiçbiri iki kez görünmez', () => {
    const pool = Array.from({ length: 60 }, (_, index) => story(`s${index}`, {
      viewsCount: 60 - index,
      createdAt: new Date(NOW - index * DAY),
    }));
    const result = feed({ pool, recommend: candidates => candidates });
    const shelved = storyIds(result.sections);
    const tail = result.rest.map(item => item.id);
    expect(tail.length).toBeGreaterThan(0);
    expect(new Set([...shelved, ...tail]).size).toBe(pool.length);
    expect(tail.filter(id => shelved.includes(id))).toEqual([]);
  });

  it('kuyrukta kapaksızlar her 12lik bloğun sonuna iner', () => {
    const pool = Array.from({ length: 48 }, (_, index) => story(`s${index}`, {
      coverImage: index % 2 === 0 ? undefined : 'https://ornek/kapak.webp',
      createdAt: new Date(NOW - index * DAY),
    }));
    const tail = feed({ pool }).rest;
    expect(tail.length).toBeGreaterThan(12);
    for (let start = 0; start < tail.length; start += 12) {
      const covered = tail.slice(start, start + 12).map(item => !!item.coverImage);
      // Blok içinde kapaklı bir kart, kapaksızdan SONRA gelmez.
      expect(covered).toEqual([...covered].sort((left, right) => Number(right) - Number(left)));
    }
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
