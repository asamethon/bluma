import { belongsOnBoard } from '@/features/conversation/utils/boardPost';
import type { Conversation, Story, User } from '@/types';
import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  or,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

export type ProfileStoryRecord = Omit<Story, 'author'>;
/**
 * Konuşma dokümanı yazarın künyesini KOPYA olarak taşır (`author` haritası);
 * pano gönderisinde bu, profil sahibi değil YAZAN kişidir.
 */
export type ProfileConversationRecord = Omit<Conversation, 'author'> & { author?: User };

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

/**
 * Yazar panosu: profilde hem kullanıcının açtığı konuşmalar hem BAŞKALARININ
 * onun panosuna bıraktığı gönderiler tek akışta, tarih sırasında görünür.
 * `or()` sorgusu her iki dalı da indeksler (firestore.indexes.json).
 * Kullanıcının başka panolara bıraktığı gönderiler `belongsOnBoard` ile elenir.
 */
export function subscribeProfileConversations(
  profileId: string,
  onData: (conversations: ProfileConversationRecord[]) => void,
  onError: () => void,
) {
  const conversationsQuery = query(
    collection(getFirestore(), 'conversations'),
    or(where('authorId', '==', profileId), where('boardOwnerId', '==', profileId)),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    conversationsQuery,
    snapshot => onData(snapshot.docs
      .map(document => ({ id: document.id, ...document.data() } as ProfileConversationRecord))
      .filter(record => belongsOnBoard(record, profileId))),
    onError,
  );
}
