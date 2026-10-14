import { storyApiActions } from '@/features/story/services/storyApi';
import type { User } from '@/store/slices/authSlice';
import { collection, deleteDoc, doc, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';

const personalCollections = [
  'likedStories',
  'savedStories',
  'likedConversations',
  'readingLists',
  'readingProgress',
  'blocked',
  'followRequests',
] as const;

async function deleteCollection(path: string[]) {
  const snapshot = await getDocs(collection(getFirestore(), path[0], ...path.slice(1)));
  await Promise.all(snapshot.docs.map(item => deleteDoc(item.ref)));
}

export async function deleteAccountData(user: User) {
  const db = getFirestore();
  const [stories, conversations] = await Promise.all([
    getDocs(query(collection(db, 'stories'), where('authorId', '==', user.id))),
    getDocs(query(collection(db, 'conversations'), where('authorId', '==', user.id))),
  ]);
  await Promise.all(stories.docs.map(story => storyApiActions.deleteStory(story.id)));
  await Promise.all(conversations.docs.map(item => deleteDoc(item.ref)));
  await Promise.all([
    deleteCollection(['users', user.id, 'followers']),
    deleteCollection(['users', user.id, 'following']),
    deleteCollection(['users', user.id, 'private']),
    ...personalCollections.map(name => deleteCollection(['users', user.id, name])),
  ]);
  const userNotifications = await getDocs(query(collection(db, 'notifications'), where('userId', '==', user.id)));
  await Promise.all(userNotifications.docs.map(item => deleteDoc(item.ref)));
  await Promise.all([
    deleteDoc(doc(db, 'userPushTokens', user.id)).catch(() => undefined),
    deleteDoc(doc(db, 'notificationSettings', user.id)).catch(() => undefined),
  ]);
  await deleteDoc(doc(db, 'users', user.id));
}
