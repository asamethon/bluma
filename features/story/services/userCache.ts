import { User } from '@/types';
import {
    doc,
    getDoc,
    getFirestore,
} from '@react-native-firebase/firestore';

// In-memory user cache to avoid refetching the same author repeatedly.
// Feeds often render many stories by the same author (and the same authors
// recur across screens); without this each row triggered its own Firestore
// read. TTL keeps profile data reasonably fresh.
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const userCache = new Map<string, { user: User | null; ts: number }>();

export const invalidateUserCache = (userId?: string) => {
  if (userId) userCache.delete(userId);
  else userCache.clear();
};

// Helper functions
export async function getUserById(userId: string): Promise<User | null> {
  try {
    if (!userId || typeof userId !== 'string') {
      console.warn('Invalid userId provided to getUserById:', userId);
      return null;
    }

    // Serve from cache when fresh
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.ts < USER_CACHE_TTL) {
      return cached.user;
    }

    // Direct document read (cheaper/faster than a __name__ query)
    const firestore = getFirestore();
    const userDoc = await getDoc(doc(firestore, 'users', userId));

    const user = userDoc.exists()
      ? ({ ...(userDoc.data() as User), id: userDoc.id })
      : null;

    userCache.set(userId, { user, ts: Date.now() });
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export const userCacheActions = {
  invalidateUserCache,
  getUserById,
};
