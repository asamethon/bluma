import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { ALGO_VERSION, type FeedSource, type FollowSource } from '../constants';
import { readSource, rememberSource } from './feedAttribution';

/**
 * Vitrin ölçümü. Olay adları ve parametreler docs/KESFET-ALGORITMASI.md §8 ile
 * aynıdır; Firebase konsolunda `section`, `src`, `algo_version` özel boyut
 * olarak kayıtlı olmalı. Hepsi fire-and-forget: ölçüm akışı asla bloklamaz.
 */
const seenSections = new Set<string>();

function track(name: string, params: Record<string, string | number>) {
  logEvent(getAnalytics(), name, params).catch(() => {});
}

/** Bölüm ekranda göründü: uygulama oturumu başına bölüm başına bir kez. */
export function trackSectionImpression(section: FeedSource, sectionPosition: number, itemCount: number) {
  if (seenSections.has(section)) return;
  seenSections.add(section);
  track('feed_impression', {
    section,
    section_position: sectionPosition,
    item_count: itemCount,
    algo_version: ALGO_VERSION,
  });
}

/** Vitrindeki bir karta dokunuldu; kaynak okuma olaylarına taşınmak üzere not edilir. */
export function trackFeedClick(storyId: string, section: FeedSource, position: number) {
  rememberSource(storyId, section);
  track('feed_click', { section, position, story_id: storyId, algo_version: ALGO_VERSION });
}

/** `story_read` / `chapter_read` olaylarına eklenecek ortak parametreler. */
export function readParams(storyId: string) {
  return { story_id: storyId, src: readSource(storyId), algo_version: ALGO_VERSION };
}

export function trackSearchQuery(queryLength: number, resultCount: number) {
  track('search_query', { query_length: queryLength, result_count: resultCount });
}

export function trackSearchClick(
  resultType: 'story' | 'user',
  position: number,
  queryLength: number,
  storyId?: string,
) {
  if (storyId) rememberSource(storyId, 'search');
  track('search_click', { result_type: resultType, position, query_length: queryLength });
}

export function trackFollow(source: FollowSource) {
  track('follow', { src: source });
}
