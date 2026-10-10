import type { Story } from '@/types';
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { patchStory } from '@/store/slices/storySlice';
import { logger } from '@/utils/logger';
import { getUserById } from '../userCache';
import { calculatePopularityScore } from './popularity';

export async function loadDiscoverStories() {
  try {
    store.dispatch(patchStory({ isLoading: true }));
    const firestore = getFirestore();

    const storiesQuery = query(
      collection(firestore, 'stories'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(storiesQuery);

    const storiesWithScores: (Story & { popularityScore: number })[] = await Promise.all(
      snapshot.docs.map(async (storyDoc) => {
        const storyData = storyDoc.data() as Story;
        const author = await getUserById(storyData.authorId);

        const story = {
          ...storyData,
          id: storyDoc.id,
          author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
        };

        return { ...story, popularityScore: calculatePopularityScore(story) };
      })
    );

    storiesWithScores.sort((a, b) => b.popularityScore - a.popularityScore);

    const topStories = storiesWithScores.slice(0, 50).map(({ popularityScore, ...story }) => story);

    store.dispatch(patchStory({ discoverStories: topStories }));
  } catch (error) {
    logger.error('Load discover stories error:', error);
  } finally {
    store.dispatch(patchStory({ isLoading: false }));
  }
}
