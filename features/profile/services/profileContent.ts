import type { Conversation, Story } from '@/types';
import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

export type ProfileStoryRecord = Omit<Story, 'author'>;
export type ProfileConversationRecord = Omit<Conversation, 'author'>;

export async function getPublishedProfileStories(authorId: string): Promise<ProfileStoryRecord[]> {
  const storiesQuery = query(
    collection(getFirestore(), 'stories'),
    where('authorId', '==', authorId),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(storiesQuery);
  return snapshot.docs.map(document => ({
    id: document.id,
    ...document.data(),
  } as ProfileStoryRecord));
}

export function subscribeProfileConversations(
  authorId: string,
  onData: (conversations: ProfileConversationRecord[]) => void,
  onError: () => void,
) {
  const conversationsQuery = query(
    collection(getFirestore(), 'conversations'),
    where('authorId', '==', authorId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    conversationsQuery,
    snapshot => onData(snapshot.docs.map(document => ({
      id: document.id,
      ...document.data(),
    } as ProfileConversationRecord))),
    onError,
  );
}
