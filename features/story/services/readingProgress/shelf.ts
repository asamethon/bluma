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

export async function loadContinueReadingShelf(limitCount: number = 5): Promise<void> {
  const { user } = store.getState().auth;
  if (!user?.id) {
    store.dispatch(patchStory({ continueReading: [], continueReadingLoaded: true }));
    return;
  }

  try {
    const { storyActions } = await import('@/store/storyStore');
    const { preferencesActions } = await import('@/store/preferencesStore');
    const { moderationActions } = await import('@/store/moderationStore');

    const progress = await loadRecentReadingProgress(10);
    const items = await Promise.all(
      progress.map(async (p) => {
        const story = await storyActions.getStoryById(p.storyId);
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
    logger.error('Load continue reading shelf error:', error);
    store.dispatch(patchStory({ continueReading: [], continueReadingLoaded: true }));
  }
}
