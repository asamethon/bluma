import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import i18n from '@/i18n';
import { authActions } from '@/store/authStore';
import { store } from '@/store';
import { patchConversation } from '@/store/slices/conversationSlice';
import type { Conversation } from '@/types';
import { logger } from '@/utils/logger';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from '@react-native-firebase/firestore';

const listeners = { userId: null as string | null, user: null as (() => void) | null };

async function enrichConversation(snapshot: any): Promise<Conversation> {
  const conversation = { id: snapshot.id, ...snapshot.data() } as Conversation;
  if (!conversation.authorId) return conversation;
  const author = await authActions.getUserById(conversation.authorId);
  return author ? { ...conversation, author } : conversation;
}

export async function getUserConversations(userId: string) {
  try {
    if (listeners.user && listeners.userId === userId) return listeners.user;
    listeners.user?.();
    listeners.userId = userId;
    const source = query(
      collection(getFirestore(), 'conversations'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    listeners.user = onSnapshot(source, snapshot => {
      void Promise.all(snapshot?.docs.map(enrichConversation) ?? []).then(userConversations => {
        store.dispatch(patchConversation({ userConversations }));
      });
    }, error => logger.error('Get user conversations error:', error));
    return listeners.user;
  } catch (error) {
    logger.error('Get user conversations error:', error);
  }
}

export async function getConversationRealTimeUpdates(conversationId: string) {
  try {
    return onSnapshot(doc(getFirestore(), 'conversations', conversationId), snapshot => {
      if (!snapshot.exists()) return;
      void enrichConversation(snapshot).then(conversation => {
        const state = store.getState().conversation;
        store.dispatch(patchConversation({
          userConversations: state.userConversations.map(item => item.id === conversationId ? conversation : item),
          ...(state.currentConversation?.id === conversationId ? { currentConversation: conversation } : {}),
        }));
      });
    }, error => logger.error('Conversation listener error:', error));
  } catch (error) {
    logger.error('Get conversation real-time updates error:', error);
  }
}

export async function createConversation(
  conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount'>,
) {
  try {
    const verified = await assertEmailVerified();
    if (!verified.ok) return { success: false, error: verified.error };
    const reference = await addDoc(collection(getFirestore(), 'conversations'), {
      ...conversation,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, conversationId: reference.id };
  } catch (error) {
    logger.error('Create conversation error:', error);
    return { success: false, error: i18n.t('conversations.createFailed') };
  }
}

export async function getConversationById(conversationId: string) {
  try {
    const snapshot = await getDoc(doc(getFirestore(), 'conversations', conversationId));
    if (!snapshot.exists()) return null;
    const conversation = await enrichConversation(snapshot);
    store.dispatch(patchConversation({ currentConversation: conversation }));
    return conversation;
  } catch (error) {
    logger.error('Get conversation error:', error);
    return null;
  }
}

export async function deleteConversation(conversationId: string) {
  try {
    await deleteDoc(doc(getFirestore(), 'conversations', conversationId));
    return { success: true };
  } catch (error) {
    logger.error('Delete conversation error:', error);
    return { success: false, error: i18n.t('conversations.deleteFailed') };
  }
}

export function cleanupConversationQueries() {
  listeners.user?.();
  listeners.user = null;
  listeners.userId = null;
}
