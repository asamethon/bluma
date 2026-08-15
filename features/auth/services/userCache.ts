import {
  doc,
  getDoc,
  getFirestore,
} from '@react-native-firebase/firestore';
import { User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';

const TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { user: User | null; at: number }>();
const inFlight = new Map<string, Promise<User | null>>();

export function invalidateCachedUser(userId?: string) {
  if (userId) cache.delete(userId);
  else cache.clear();
}

export function primeCachedUser(user: User) {
  cache.set(user.id, { user, at: Date.now() });
}

async function fetchUserById(userId: string): Promise<User | null> {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? ({ id: userDoc.id, ...userDoc.data() } as User) : null;
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  if (!userId || typeof userId !== 'string') return null;

  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.user;

  const pending = inFlight.get(userId);
  if (pending) return pending;

  const promise = fetchUserById(userId)
    .then(user => {
      cache.set(userId, { user, at: Date.now() });
      return user;
    })
    .finally(() => {
      inFlight.delete(userId);
    });

  inFlight.set(userId, promise);
  return promise;
}
