import type { FeedSource } from '@/features/discovery/constants';
import { calculatePopularityScore } from '@/features/story/services/discover/popularity';
import type { Story } from '@/types';

/**
 * Ana sayfa bölümlerini kuran saf fonksiyon (Faz 0, bkz. docs/KESFET-ALGORITMASI.md §6).
 *
 * Kural: bölümler yukarıdan aşağı doldurulur ve bir hikâye ana sayfada yalnızca
 * BİR kez görünür. Okumaya Devam Et'teki hikâyeler başka hiçbir bölüme girmez.
 * Eşiğin altında kalan bölüm hiç gösterilmez (yarım raf göstermeyiz).
 */
export type ContinueEntry = { story: Story; chapterIndex: number };

type SectionBase = { key: FeedSource; size: number };
export type HomeSection =
  | (SectionBase & { layout: 'continue'; entries: ContinueEntry[] })
  | (SectionBase & { layout: 'feature' | 'shelf' | 'list'; stories: Story[] });

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
 * Bölüm başına çeşitlilik ve kalite kuralları.
 *
 * Neden: katalog küçükken (1 Kasım 2026: 88 yayında hikâye) tek bir üretken
 * yazar bir bölümü tek başına doldurabiliyordu — "Yeni Geldi" ekranda üst üste
 * aynı yazarın beş şiirini gösteriyordu. Kapaksız/adsız taslak artıkları da
 * büyük kapak kartlarında boş kutu olarak duruyordu.
 *
 * `perAuthor`: aynı yazardan bir bölüme en fazla kaç kart girebilir.
 * `perCategory`: aynı türden en fazla kaç kart (yalnız liste bölümünde).
 * `requireCover`: büyük kapak düzeni; kapağı olmayan hikâye alınmaz.
 */
type SectionRule = {
  limit: number;
  min: number;
  perAuthor: number;
  perCategory?: number;
  requireCover?: boolean;
};

const RULES: Record<'following' | 'editors_pick' | 'for_you' | 'popular_now' | 'new_arrivals' | 'most_read', SectionRule> = {
  // Takip edilen yazar okurun kendi seçimi: sınır daha gevşek.
  following: { limit: SHELF_SIZE, min: 1, perAuthor: 3, requireCover: true },
  editors_pick: { limit: 1, min: 1, perAuthor: 1, requireCover: true },
  // Sana Özel'in amacı çeşitlilik: aynı yazardan iki kart yan yana geldiğinde
  // raf "bozuk" görünüyor, o yüzden burada tek kart.
  for_you: { limit: SHELF_SIZE, min: MIN_SHELF, perAuthor: 1, requireCover: true },
  popular_now: { limit: SHELF_SIZE, min: MIN_SHELF, perAuthor: 2, requireCover: true },
  // Liste düzeni küçük küçük resim kullanır; kapak şart değil ama tek yazar
  // bölümü dolduramaz ve tür de dağıtılır.
  new_arrivals: { limit: NEW_ARRIVALS_MAX, min: 1, perAuthor: 1, perCategory: 2 },
  most_read: { limit: SHELF_SIZE, min: MIN_SHELF, perAuthor: 2, requireCover: true },
};

/** Vitrine girebilmenin alt eşiği: adı olan ve düzenin gerektirdiği kapağı olan hikâye. */
export function isShowcaseReady(story: Story, requireCover = false): boolean {
  if (!story.title?.trim()) return false;
  return !requireCover || !!story.coverImage?.trim();
}

/** Firestore Timestamp, Date, sayı ya da metin → milisaniye (bilinmiyorsa 0). */
export function toMillis(value: unknown): number {
  if (!value) return 0;
  const stamp = value as { toMillis?: () => number; toDate?: () => Date };
  if (typeof stamp.toMillis === 'function') return stamp.toMillis();
  if (typeof stamp.toDate === 'function') return stamp.toDate().getTime();
  const parsed = new Date(value as string | number | Date).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Yerel takvime göre gün numarası; editör seçkisi her gün bir sonrakine döner. */
export function localDayNumber(now: number): number {
  const date = new Date(now);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
}

const newestFirst = (left: Story, right: Story) => toMillis(right.createdAt) - toMillis(left.createdAt);

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

export function buildHomeSections(input: HomeSectionsInput): HomeSection[] {
  const now = input.now ?? Date.now();
  const used = new Set<string>();
  const sections: HomeSection[] = [];
  const unused = (stories: Story[]) => stories.filter(story => !used.has(story.id));

  const add = (key: keyof typeof RULES, layout: 'feature' | 'shelf' | 'list', candidates: Story[]) => {
    const rule = RULES[key];
    const stories: Story[] = [];
    const byAuthor = new Map<string, number>();
    const byCategory = new Map<string, number>();
    const taken = (map: Map<string, number>, value: string) => map.get(value) ?? 0;
    for (const story of candidates) {
      if (stories.length >= rule.limit) break;
      if (used.has(story.id) || stories.some(picked => picked.id === story.id)) continue;
      if (!isShowcaseReady(story, rule.requireCover)) continue;
      if (taken(byAuthor, story.authorId) >= rule.perAuthor) continue;
      if (rule.perCategory && story.category && taken(byCategory, story.category) >= rule.perCategory) continue;
      byAuthor.set(story.authorId, taken(byAuthor, story.authorId) + 1);
      byCategory.set(story.category, taken(byCategory, story.category) + 1);
      stories.push(story);
    }
    if (stories.length < rule.min) return;
    stories.forEach(story => used.add(story.id));
    sections.push({ key, layout, stories, size: stories.length });
  };

  const entries = input.continueReading.slice(0, CONTINUE_MAX);
  if (entries.length) {
    entries.forEach(entry => used.add(entry.story.id));
    sections.push({ key: 'continue_reading', layout: 'continue', entries, size: entries.length });
  }

  add('following', 'shelf', [...input.following].sort(newestFirst));

  const picks = unused(input.pool.filter(story => story.isEditorsPick));
  if (picks.length) add('editors_pick', 'feature', [picks[localDayNumber(now) % picks.length]]);

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

  return sections;
}
