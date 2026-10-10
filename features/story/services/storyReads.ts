import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { storyFromSnapshot } from './listeners/storySnapshot';

const timestamp = (value: any) => (value?.toDate?.() ?? new Date(value || 0)).getTime();

export async function getStoryById(storyId: string): Promise<Story | null> {
  if (!storyId) return null;
  try {
    const snapshot = await getDoc(doc(getFirestore(), 'stories', storyId));
    return snapshot.exists() ? storyFromSnapshot(snapshot) : null;
  } catch (error: any) {
    if (error?.code === 'firestore/permission-denied') {
      logger.debug('Get story skipped (no longer accessible):', storyId);
    } else logger.error('Get story error:', error);
    return null;
  }
}

export async function loadUserStories(userId: string) {
  store.dispatch(patchStory({ isLoading: true }));
  try {
    const snapshot = await getDocs(query(collection(getFirestore(), 'stories'), where('authorId', '==', userId)));
    const stories = await Promise.all(snapshot.docs.map(storyFromSnapshot));
    stories.sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
    store.dispatch(patchStory({ userStories: stories }));
  } catch (error) {
    logger.error('Load user stories error:', error);
  } finally {
    store.dispatch(patchStory({ isLoading: false }));
  }
}
