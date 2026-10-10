import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import i18n from '@/i18n';
import { authActions } from '@/store/authStore';
import { store } from '@/store';
import { patchConversation } from '@/store/slices/conversationSlice';
import type { ConversationComment } from '@/types';
import { logger } from '@/utils/logger';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { notifyConversationComment } from './conversationNotifications';

async function enrichComment(snapshot: any): Promise<ConversationComment> {
  const comment = { id: snapshot.id, ...snapshot.data() } as ConversationComment;
  if (!comment.userId) return comment;
  const user = await authActions.getUserById(comment.userId);
  return user ? { ...comment, user } : comment;
}

export async function getConversationComments(conversationId: string) {
  try {
    const source = query(
      collection(getFirestore(), 'conversationComments'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(source, snapshot => {
      void Promise.all(snapshot?.docs.map(enrichComment) ?? []).then(currentConversationComments => {
        store.dispatch(patchConversation({ currentConversationComments }));
      });
    }, error => logger.error('Conversation comments listener error:', error));
  } catch (error) {
    logger.error('Get conversation comments error:', error);
  }
}

export async function addComment(conversationId: string, content: string, image?: string) {
  try {
    const user = store.getState().auth.user;
    if (!user) return { success: false, error: i18n.t('errors.userNotFound') };
    const verified = await assertEmailVerified();
    if (!verified.ok) return { success: false, error: verified.error };
    if (image && image.length > 1_000_000) return { success: false, error: i18n.t('imageUpload.tooLarge') };
    const db = getFirestore();
    await addDoc(collection(db, 'conversationComments'), {
      conversationId,
      userId: user.id,
      content,
      likesCount: 0,
      createdAt: serverTimestamp(),
      ...(image ? { image } : {}),
    });
    await updateDoc(doc(db, 'conversations', conversationId), {
      commentsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    void notifyConversationComment(conversationId, user.id, content);
    return { success: true };
  } catch (error) {
    logger.error('Add comment error:', error);
    return { success: false, error: i18n.t('conversations.commentFailed') };
  }
}
