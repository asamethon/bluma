import { getUserById } from '@/features/auth/services/userCache';
import type { User } from '@/types';
import { collection, doc, getDocs, getFirestore } from '@react-native-firebase/firestore';

export type ProfileConnections = {
  followers: User[];
  following: User[];
};

async function resolveUsers(ids: string[]): Promise<User[]> {
  const users = await Promise.all(ids.map(getUserById));
  return users.filter((user): user is User => user !== null);
}

export async function getProfileConnections(userId: string): Promise<ProfileConnections> {
  // `users/<id>` bir DOKÜMAN yolu: collection() burada 'must point to a
  // collection' hatası veriyordu.
  const userRef = doc(getFirestore(), 'users', userId);
  const [followers, following] = await Promise.all([
    getDocs(collection(userRef, 'followers')),
    getDocs(collection(userRef, 'following')),
  ]);

  const [resolvedFollowers, resolvedFollowing] = await Promise.all([
    resolveUsers(followers.docs.map(document => document.id)),
    resolveUsers(following.docs.map(document => document.id)),
  ]);

  return { followers: resolvedFollowers, following: resolvedFollowing };
}
