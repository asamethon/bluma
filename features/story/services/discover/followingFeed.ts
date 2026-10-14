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

/** Takip rafı 10 dk içinde tekrar okunmaz (aşağı çekince `force` ile okunur). */
const FOLLOWING_TTL_MS = 10 * 60 * 1000;
const following = { loadedAt: 0, userId: null as string | null };

export async function loadFollowingStories(options: { force?: boolean } = {}) {
  try {
    const { user } = store.getState().auth;
    if (!user?.id) {
      following.userId = null;
      store.dispatch(patchStory({ followingStories: [] }));
      return;
    }
    const fresh = following.userId === user.id && Date.now() - following.loadedAt < FOLLOWING_TTL_MS;
    if (fresh && !options.force) return;
    following.userId = user.id;
    following.loadedAt = Date.now();

    const firestore = getFirestore();

    // Takip dokümanları `followedAt` ile yazılıyor; burada sıralama alanı
    // verilirse (eskiden `createdAt`) Firestore o alanı taşımayan dokümanları
    // döndürmez ve liste hep boş gelir. Sıralama hikâye tarihine göre aşağıda.
    // Arka plan rafı olduğu için global `isLoading` da açılmaz.
    const followingSnapshot = await getDocs(collection(firestore, 'users', user.id, 'following'));
    const followingUserIds = followingSnapshot.docs
      .map((doc: any) => doc.id || doc.data().userId)
      .filter(Boolean);

    if (followingUserIds.length === 0) {
      store.dispatch(patchStory({ followingStories: [] }));
      return;
    }

    const chunks = chunkArray(followingUserIds, 10);
    const chunkResults = await Promise.all(
      chunks.map(async (chunk) => {
        const storiesQuery = query(
          collection(firestore, 'stories'),
          where('authorId', 'in', chunk),
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const snapshot = await getDocs(storiesQuery);

        return Promise.all(
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
      })
    );
    const allStories: Story[] = chunkResults.flat();

    allStories.sort((a, b) => {
      const dateA = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt
        ? (a.createdAt as any).toDate()
        : new Date(a.createdAt || 0);
      const dateB = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt
        ? (b.createdAt as any).toDate()
        : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    store.dispatch(patchStory({ followingStories: allStories.slice(0, 50) }));
  } catch (error) {
    following.loadedAt = 0;
    logger.error('Load following stories error:', error);
    store.dispatch(patchStory({ followingStories: [] }));
  }
}

/** Firestore `in` sorgusu en fazla 10 değer alır; listeyi ona göre böler. */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
