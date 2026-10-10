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

  const add = (key: FeedSource, layout: 'feature' | 'shelf' | 'list', candidates: Story[], limit: number, min: number) => {
    const stories: Story[] = [];
    for (const story of candidates) {
      if (stories.length >= limit) break;
      if (used.has(story.id) || stories.some(picked => picked.id === story.id)) continue;
      stories.push(story);
    }
    if (stories.length < min) return;
    stories.forEach(story => used.add(story.id));
    sections.push({ key, layout, stories, size: stories.length });
  };

  const entries = input.continueReading.slice(0, CONTINUE_MAX);
  if (entries.length) {
    entries.forEach(entry => used.add(entry.story.id));
    sections.push({ key: 'continue_reading', layout: 'continue', entries, size: entries.length });
  }

  add('following', 'shelf', [...input.following].sort(newestFirst), SHELF_SIZE, 1);

  const picks = unused(input.pool.filter(story => story.isEditorsPick));
  if (picks.length) add('editors_pick', 'feature', [picks[localDayNumber(now) % picks.length]], 1, 1);

  add('for_you', 'shelf', input.recommend(unused(input.pool)), SHELF_SIZE, MIN_SHELF);
  add('popular_now', 'shelf', popularNow(unused(input.pool), now), SHELF_SIZE, MIN_SHELF);
  add('new_arrivals', 'list', unused(input.pool).sort(newestFirst), NEW_ARRIVALS_MAX, 1);
  add(
    'most_read',
    'shelf',
    unused(input.pool)
      .filter(story => (story.viewsCount || 0) > 0)
      .sort((left, right) => (right.viewsCount || 0) - (left.viewsCount || 0)),
    SHELF_SIZE,
    MIN_SHELF,
  );

  return sections;
}
