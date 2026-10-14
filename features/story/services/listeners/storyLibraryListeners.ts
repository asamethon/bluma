import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { collection, getFirestore, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { getStoryForShelf } from '../storyReads';

const listeners = {
  liked: null as (() => void) | null,
  saved: null as (() => void) | null,
  userId: null as string | null,
};

/**
 * Dinleyici her beğeni/kaydetmede tüm listeyi yeniden verir; hikâyeler
 * önbellekten gelir, yalnızca yeni olan Firestore'dan okunur.
 */
const loadStories = async (snapshot: any) => {
  const fetched = await Promise.all(snapshot.docs.map((item: any) => getStoryForShelf(item.data().storyId)));
  return fetched.filter((story): story is Story => Boolean(story));
};

export function setupStoryLibraryListeners() {
  const userId = store.getState().auth.user?.id;
  if (!userId) return;
  if (listeners.userId === userId && listeners.liked && listeners.saved) return;
  cleanupStoryLibraryListeners();
  listeners.userId = userId;
  const db = getFirestore();
  listeners.liked = onSnapshot(
    query(collection(db, 'users', userId, 'likedStories'), orderBy('createdAt', 'desc')),
    snapshot => { void loadStories(snapshot).then(likedStories => store.dispatch(patchStory({ likedStories }))); },
    error => logger.error('Liked stories listener error:', error),
  );
  listeners.saved = onSnapshot(
    query(collection(db, 'users', userId, 'savedStories'), orderBy('createdAt', 'desc')),
    snapshot => { void loadStories(snapshot).then(savedStories => store.dispatch(patchStory({ savedStories }))); },
    error => logger.error('Saved stories listener error:', error),
  );
}

export function cleanupStoryLibraryListeners() {
  listeners.liked?.();
  listeners.saved?.();
  listeners.liked = null;
  listeners.saved = null;
  listeners.userId = null;
}
