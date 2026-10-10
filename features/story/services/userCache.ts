import { User } from '@/types';
import {
  getUserById as getUserByIdShared,
  invalidateCachedUser,
} from '@/features/auth/services/userCache';


const invalidateUserCache = (userId?: string) => invalidateCachedUser(userId);

export async function getUserById(userId: string): Promise<User | null> {
  return (await getUserByIdShared(userId)) as User | null;
}

export const userCacheActions = {
  invalidateUserCache,
  getUserById,
};
