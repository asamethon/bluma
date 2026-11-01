import type { FeedSource } from '@/features/discovery/constants';
import { calculatePopularityScore } from '@/features/story/services/discover/popularity';
import type { Story } from '@/types';
import { categoryEntries, type CategoryEntry } from './categoryRanking';
import { coverLast, coverLastInBlocks, localDayNumber, newestFirst } from './storyOrder';
import { toMillis } from '@/utils/time';

/**
 * Ana sayfa bölümlerini kuran saf fonksiyon (Faz 0, bkz. docs/KESFET-ALGORITMASI.md §6).
 *
 * Kural: bölümler yukarıdan aşağı doldurulur ve bir hikâye ana sayfada yalnızca
 * BİR kez görünür. Okumaya Devam Et'teki hikâyeler başka hiçbir bölüme girmez.
 * Eşiğin altında kalan bölüm hiç gösterilmez (yarım raf göstermeyiz).
 *
 * Bölümler bittiğinde liste bitmez: rafların dışında kalan HER hikâye `rest`
 * ile sonsuz kuyruğa düşer. Ana sayfanın sonu yoktur; kuyruk tükenince ekran
 * katalogdan bir sonraki sayfayı çeker (`useEndlessFeed`).
 */
export type ContinueEntry = { story: Story; chapterIndex: number };

type SectionBase = { key: FeedSource; size: number };
export type HomeSection =
  | (SectionBase & { layout: 'continue'; entries: ContinueEntry[] })
  | (SectionBase & { layout: 'categories'; categories: CategoryEntry[] })
  | (SectionBase & { layout: 'feature' | 'shelf' | 'list'; stories: Story[] });

/** Bölümler + bölümlerin dışında kalan, sonsuz kuyruğu besleyen hikâyeler. */
export type HomeFeed = { sections: HomeSection[]; rest: Story[] };

export type HomeSectionsInput = {
  /** Görünür (engel/gizli/+18 filtresinden geçmiş) hikâyeler. */
  pool: Story[];
  continueReading: ContinueEntry[];
  following: Story[];
  /** Kişisel öneri: adaylar arasından en uygunları sırayla döner. */
  recommend: (candidates: Story[]) => Story[];
  now?: number;
};

const DAY = 24 * 60 * 60 * 1000;
const SHELF_SIZE = 12;
const MIN_SHELF = 3;
const CONTINUE_MAX = 3;
const NEW_ARRIVALS_MAX = 6;
const RECENT_WINDOW = 7 * DAY;
const RECENT_BOOST = 1.25;

/**
 * Bölüm başına çeşitlilik kuralları.
 *
 * Neden: katalog küçükken (1 Kasım 2026: 88 yayında hikâye) tek bir üretken
 * yazar bir bölümü tek başına doldurabiliyordu — "Yeni Geldi" ekranda üst üste
 * aynı yazarın beş şiirini gösteriyordu.
 *
 * `perAuthor`: aynı yazardan bir bölüme en fazla kaç kart girebilir.
 * `perCategory`: aynı türden en fazla kaç kart (yalnız liste bölümünde).
 *
 * Kapak artık kural değil: seçim kapağa bakmadan yapılır, kapaksız kartlar
 * `coverLast` ile satırın sonuna iner (bkz. services/storyOrder.ts).
 */
type SectionRule = {
  limit: number;
  min: number;
  perAuthor: number;
  perCategory?: number;
};

const RULES: Record<'following' | 'editors_pick' | 'for_you' | 'popular_now' | 'new_arrivals' | 'most_read', SectionRule> = {
  // Takip edilen yazar okurun kendi seçimi: sınır daha gevşek.
  following: { limit: SHELF_SIZE, min: 1, perAuthor: 3 },
  editors_pick: { limit: 1, min: 1, perAuthor: 1 },
  // Sana Özel'in amacı çeşitlilik: aynı yazardan iki kart yan yana geldiğinde
  // raf "bozuk" görünüyor, o yüzden burada tek kart.
  for_you: { limit: SHELF_SIZE, min: MIN_SHELF, perAuthor: 1 },
  popular_now: { limit: SHELF_SIZE, min: MIN_SHELF, perAuthor: 2 },
  new_arrivals: { limit: NEW_ARRIVALS_MAX, min: 1, perAuthor: 1, perCategory: 2 },
  most_read: { limit: SHELF_SIZE, min: MIN_SHELF, perAuthor: 2 },
};

/** Vitrine girebilmenin alt eşiği: adı olan hikâye. */
export function isShowcaseReady(story: Story): boolean {
  return !!story.title?.trim();
}

function popularNow(stories: Story[], now: number): Story[] {
  return stories
    .map(story => ({
      story,
      score: calculatePopularityScore(story)
        * (now - toMillis(story.createdAt) <= RECENT_WINDOW ? RECENT_BOOST : 1),
    }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map(item => item.story);
}

export function buildHomeSections(input: HomeSectionsInput): HomeFeed {
  const now = input.now ?? Date.now();
  const used = new Set<string>();
  const sections: HomeSection[] = [];
  const unused = (stories: Story[]) => stories.filter(story => !used.has(story.id) && isShowcaseReady(story));

  const add = (key: keyof typeof RULES, layout: 'feature' | 'shelf' | 'list', candidates: Story[]) => {
    const rule = RULES[key];
    const picked: Story[] = [];
    const byAuthor = new Map<string, number>();
    const byCategory = new Map<string, number>();
    const taken = (map: Map<string, number>, value: string) => map.get(value) ?? 0;
    for (const story of candidates) {
      if (picked.length >= rule.limit) break;
      if (used.has(story.id) || picked.some(item => item.id === story.id)) continue;
      if (!isShowcaseReady(story)) continue;
      if (taken(byAuthor, story.authorId) >= rule.perAuthor) continue;
      if (rule.perCategory && story.category && taken(byCategory, story.category) >= rule.perCategory) continue;
      byAuthor.set(story.authorId, taken(byAuthor, story.authorId) + 1);
      byCategory.set(story.category, taken(byCategory, story.category) + 1);
      picked.push(story);
    }
    if (picked.length < rule.min) return;
    picked.forEach(story => used.add(story.id));
    // Sıralama seçimden sonra: kapaksızlar rafın sonuna iner ama rafa girer.
    sections.push({ key, layout, stories: coverLast(picked), size: picked.length });
  };

  const entries = input.continueReading.slice(0, CONTINUE_MAX);
  if (entries.length) {
    entries.forEach(entry => used.add(entry.story.id));
    sections.push({ key: 'continue_reading', layout: 'continue', entries, size: entries.length });
  }

  add('following', 'shelf', [...input.following].sort(newestFirst));

  const picks = unused(input.pool.filter(story => story.isEditorsPick));
  if (picks.length) add('editors_pick', 'feature', [picks[localDayNumber(now) % picks.length]]);

  // Tür gezintisi (Wattpad'deki "Browse"): bütün türler, hikâye sayılarıyla.
  // Editörün seçiminin hemen altında durur; raf değil, gezinti olduğu için
  // dedupe'tan etkilenmez ve boş türler de listelenir.
  // Katalog boşken tür ızgarası da gösterilmez: 10 tane "0 hikâye" kutusu
  // boş uygulamayı daha da boş gösterir.
  const categories = input.pool.length ? categoryEntries(input.pool) : [];
  if (categories.length) {
    sections.push({ key: 'categories', layout: 'categories', categories, size: categories.length });
  }

  add('for_you', 'shelf', input.recommend(unused(input.pool)));
  add('popular_now', 'shelf', popularNow(unused(input.pool), now));
  add('new_arrivals', 'list', unused(input.pool).sort(newestFirst));
  add(
    'most_read',
    'shelf',
    unused(input.pool)
      .filter(story => (story.viewsCount || 0) > 0)
      .sort((left, right) => (right.viewsCount || 0) - (left.viewsCount || 0)),
  );

  return { sections, rest: coverLastInBlocks(unused(input.pool).sort(newestFirst)) };
}
