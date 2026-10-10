import { Story } from '@/types';
import {
    doc,
    getCountFromServer,
    getDoc,
    collection,
    getFirestore,
    increment,
    serverTimestamp,
    setDoc,
    updateDoc,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import { logger } from '@/utils/logger';

const inFlightViewIncrements = new Set<string>();

async function incrementStoryViews(storyId: string) {
  const { user } = store.getState().auth;
  if (!user?.id) return;
  const dedupeKey = `${storyId}_${user.id}`;
  if (inFlightViewIncrements.has(dedupeKey)) return;
  inFlightViewIncrements.add(dedupeKey);

  try {
    const firestore = getFirestore();
    const viewRef = doc(firestore, 'stories', storyId, 'views', user.id);

    const viewDoc = await getDoc(viewRef);
    const currentViewCount = viewDoc.exists() ? (viewDoc.data()?.count || 0) : 0;

    if (currentViewCount >= 3) {
      logger.debug('User has reached max view count for this story');
      return;
    }

    await setDoc(viewRef, {
      count: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    await updateDoc(doc(firestore, 'stories', storyId), {
      viewsCount: increment(1),
    });

    const bump = (list: Story[]) =>
      list.map(s => s.id === storyId ? { ...s, viewsCount: (s.viewsCount || 0) + 1 } : s);
    const { stories, discoverStories, followingStories } = store.getState().story;
    store.dispatch(patchStory({
      stories: bump(stories),
      discoverStories: bump(discoverStories),
      followingStories: bump(followingStories),
    }));
    const cur = store.getState().story.currentStory;
    if (cur && cur.id === storyId) {
      store.dispatch(patchStory({ currentStory: { ...cur, viewsCount: (cur.viewsCount || 0) + 1 } }));
    }

  } catch (error: any) {
    if (error?.code === 'firestore/permission-denied') {
      logger.debug('Increment story views skipped (rate/race, non-critical):', error.message);
    } else {
      logger.error('Increment story views error:', error);
    }
  } finally {
    inFlightViewIncrements.delete(dedupeKey);
  }
}

async function getUniqueReadersCount(storyId: string): Promise<number> {
  try {
    const firestore = getFirestore();
    const countSnap = await getCountFromServer(collection(firestore, 'stories', storyId, 'views'));
    return countSnap.data().count;
  } catch (error) {
    logger.error('Get unique readers count error:', error);
    return 0;
  }
}

export const viewsActions = {
  incrementStoryViews,
  getUniqueReadersCount,
};
