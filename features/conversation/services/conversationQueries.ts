import { assertEmailVerified } from '@/features/auth/services/emailVerification';
import { publicProfileData } from '@/features/auth/services/profilePrivacy';
import i18n from '@/i18n';
import { authActions } from '@/store/authStore';
import { store } from '@/store';
import { patchConversation } from '@/store/slices/conversationSlice';
import type { Conversation } from '@/types';
import { logger } from '@/utils/logger';
import { belongsOnBoard } from '../utils/boardPost';
import { notifyBoardPost, notifyConversationMentions } from './conversationNotifications';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  or,
  orderBy,
  query,
  serverTimestamp,
  where,
} from '@react-native-firebase/firestore';

const listeners = { userId: null as string | null, user: null as (() => void) | null };

async function enrichConversation(snapshot: any): Promise<Conversation> {
  const conversation = { id: snapshot.id, ...snapshot.data() } as Conversation;
  if (!conversation.authorId) return conversation;
  // Pano gönderisinde künyede hedef de gösterilir: pano sahibini de çöz.
  const owner = conversation.boardOwnerId && conversation.boardOwnerId !== conversation.authorId
    ? await authActions.getUserById(conversation.boardOwnerId)
    : null;
  const author = await authActions.getUserById(conversation.authorId);
  return {
    ...conversation,
    ...(author ? { author } : {}),
    ...(owner ? { boardOwner: owner } : {}),
  };
}

export async function getUserConversations(userId: string) {
  try {
    if (listeners.user && listeners.userId === userId) return listeners.user;
    listeners.user?.();
    listeners.userId = userId;
    // Kendi panom: kendi açtıklarım + BAŞKALARININ panoma bıraktığı gönderiler
    // tek akışta, tarih sırasında. Kendimin başka panolara bıraktığı gönderiler
    // `belongsOnBoard` ile elenir (bkz. firestore.indexes.json).
    const source = query(
      collection(getFirestore(), 'conversations'),
      or(where('authorId', '==', userId), where('boardOwnerId', '==', userId)),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    listeners.user = onSnapshot(source, snapshot => {
      const owned = (snapshot?.docs ?? []).filter(document => (
        belongsOnBoard(document.data() as { authorId?: string; boardOwnerId?: string }, userId)
      ));
      void Promise.all(owned.map(enrichConversation)).then(userConversations => {
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
    const payload: Record<string, any> = {
      ...conversation,
      author: publicProfileData(conversation.author),
      // Yeni istemci her gönderide panoyu yazar; kendi profiline yazıyorsa
      // kendi uid'si. Eski istemcinin alansız kayıtları olduğu gibi kalır.
      boardOwnerId: conversation.boardOwnerId || conversation.authorId,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // `boardOwner` yalnızca istemci künyesi; dokümana yazılmaz.
    delete payload.boardOwner;
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    const reference = await addDoc(collection(getFirestore(), 'conversations'), payload);
    const boardPost = payload.boardOwnerId !== conversation.authorId;
    void notifyConversationMentions(reference.id, conversation.content, {
      // Pano sahibi etiketlenmişse ikinci kez uyarılmaz: pano bildirimi gidiyor.
      ...(boardPost ? { skipUserId: payload.boardOwnerId } : {}),
    });
    if (boardPost) void notifyBoardPost(reference.id, payload.boardOwnerId, conversation.author);
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

export function cleanupConversationQueries() {
  listeners.user?.();
  listeners.user = null;
  listeners.userId = null;
}
