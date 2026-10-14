import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import type { ReadingProgress } from './types';

export async function loadRecentReadingProgress(limitCount: number = 10): Promise<ReadingProgress[]> {
  const { user } = store.getState().auth;
  if (!user?.id) return [];

  try {
    const q = query(
      collection(getFirestore(), 'users', user.id, 'readingProgress'),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data() as any;
      return {
        storyId: d.id,
        chapterIndex: data.chapterIndex || 0,
        scrollRatio: data.scrollRatio || 0,
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : 0,
      };
    });
  } catch (error) {
    logger.error('Load recent reading progress error:', error);
    return [];
  }
}

/**
 * Raf, ana sayfaya her dönüşte değil yalnızca gerektiğinde tazelenir: ilk
 * yükleme, okuyucuda bölüm değişti (`markContinueReadingStale`), 5 dk geçti ya
 * da kullanıcı aşağı çekti (`force`).
 */
const SHELF_TTL_MS = 5 * 60 * 1000;
const shelf = { loadedAt: 0, userId: null as string | null, stale: true };

export function markContinueReadingStale() {
  shelf.stale = true;
}

export async function loadContinueReadingShelf(
  limitCount: number = 5,
  options: { force?: boolean } = {},
): Promise<void> {
  const { user } = store.getState().auth;
  if (!user?.id) {
    shelf.userId = null;
    store.dispatch(patchStory({ continueReading: [], continueReadingLoaded: true }));
    return;
  }
  const fresh = shelf.userId === user.id && !shelf.stale && Date.now() - shelf.loadedAt < SHELF_TTL_MS;
  if (fresh && !options.force) return;
  shelf.userId = user.id;
  shelf.loadedAt = Date.now();
  shelf.stale = false;

  try {
    const { getStoryForShelf } = await import('../storyReads');
    const { preferencesActions } = await import('@/store/preferencesStore');
    const { moderationActions } = await import('@/store/moderationStore');

    const progress = await loadRecentReadingProgress(10);
    const items = await Promise.all(
      progress.map(async (p) => {
        const story = await getStoryForShelf(p.storyId);
        return story ? { story, chapterIndex: p.chapterIndex } : null;
      })
    );
    const visible = items.filter((x): x is { story: Story; chapterIndex: number } => !!x);
    const visibleStories = preferencesActions.filterMature(
      moderationActions.filterHidden(moderationActions.filterBlocked(visible.map((x) => x.story)))
    );
    const visibleIds = new Set(visibleStories.map((s) => s.id));
    const result = visible.filter((x) => visibleIds.has(x.story.id)).slice(0, limitCount);
    store.dispatch(patchStory({ continueReading: result, continueReadingLoaded: true }));
  } catch (error) {
    shelf.stale = true;
    logger.error('Load continue reading shelf error:', error);
    store.dispatch(patchStory({ continueReading: [], continueReadingLoaded: true }));
  }
}
