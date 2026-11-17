import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';

type Reference = Parameters<ReturnType<typeof writeBatch>['delete']>[0];

/** Firestore toplu yazma sınırı. */
const BATCH_LIMIT = 500;

async function deleteReferences(references: Reference[]) {
  const db = getFirestore();
  const chunks = Array.from({ length: Math.ceil(references.length / BATCH_LIMIT) }, (_, index) => (
    references.slice(index * BATCH_LIMIT, (index + 1) * BATCH_LIMIT)
  ));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(reference => batch.delete(reference));
    await batch.commit();
  }
}

/**
 * Gönderiyi yazan ya da pano sahibi siler. Yorumlar top-level
 * `conversationComments` koleksiyonunda durduğu için konuşma dokümanıyla
 * birlikte gitmez; yetim kalmasınlar diye burada temizlenirler.
 *
 * SIRA ÖNEMLİ: alt kayıtlar konuşma dokümanından ÖNCE silinir — kuraldaki
 * `ownsConversation()` yetkiyi konuşma dokümanından okuyor (hikâye silmede de
 * aynı kalıp, bkz. features/story/services/storyDeletion.ts).
 */
export async function deleteConversation(conversationId: string) {
  try {
    const db = getFirestore();
    const reference = doc(db, 'conversations', conversationId);
    if (!(await getDoc(reference)).exists()) return { success: true };
    const [comments, likes] = await Promise.all([
      getDocs(query(collection(db, 'conversationComments'), where('conversationId', '==', conversationId))),
      getDocs(collection(db, 'conversations', conversationId, 'likes')),
    ]);
    await deleteReferences([
      ...comments.docs.map(item => item.ref),
      ...likes.docs.map(item => item.ref),
    ]);
    await deleteDoc(reference);
    return { success: true };
  } catch (error) {
    logger.error('Delete conversation error:', error);
    return { success: false, error: i18n.t('conversations.deleteFailed') };
  }
}
