import { Story } from '@/types';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
} from '@react-native-firebase/firestore';
import { getUserById } from './userCache';
import { patchStory } from '@/store/slices/storySlice';
import { store } from '@/store';

const PAGE_SIZE = 30;

export async function loadMoreStories(): Promise<boolean> {
  const current = store.getState().story.stories;
  if (current.length === 0) return false;

  const firestore = getFirestore();
  const q = query(
    collection(firestore, 'stories'),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
    startAfter(current[current.length - 1].createdAt),
    limit(PAGE_SIZE)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;

  const more: Story[] = await Promise.all(
    snapshot.docs.map(async (storyDoc) => {
      const storyData = storyDoc.data() as Story;
      const author = await getUserById(storyData.authorId);
      return {
        ...storyData,
        id: storyDoc.id,
        author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
      };
    })
  );

  const existingIds = new Set(current.map((s) => s.id));
  const fresh = more.filter((s) => !existingIds.has(s.id));
  if (fresh.length > 0) {
    store.dispatch(patchStory({ stories: [...current, ...fresh] }));
  }
  return snapshot.size >= PAGE_SIZE;
}

export const feedPaginationActions = { loadMoreStories };
