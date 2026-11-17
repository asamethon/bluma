import { setLikeState } from '@/lib/likeToggle';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchConversation } from '@/store/slices/conversationSlice';
import type { Conversation } from '@/types';
import { logger } from '@/utils/logger';
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from '@react-native-firebase/firestore';
import { notifyConversationLike } from './conversationNotifications';

const listener = { unsubscribe: null as (() => void) | null, userId: null as string | null };

export async function getLikedConversations(userId: string) {
  try {
    if (listener.unsubscribe && listener.userId === userId) return listener.unsubscribe;
    listener.unsubscribe?.();
    listener.userId = userId;
    const source = query(collection(getFirestore(), 'users', userId, 'likedConversations'), orderBy('createdAt', 'desc'));
    listener.unsubscribe = onSnapshot(source, snapshot => {
      const likedConversationIds = snapshot?.docs
        .map(item => item.data()?.conversationId)
        .filter((id: unknown): id is string => typeof id === 'string') ?? [];
      store.dispatch(patchConversation({ likedConversationIds }));
    }, error => logger.error('Get liked conversations error:', error));
    return listener.unsubscribe;
  } catch (error) {
    logger.error('Get liked conversations error:', error);
  }
}

/**
 * Beğeni durumunu AÇIKÇA kurar (ters çevirmez): hata yolunda da aynı
 * fonksiyonla son bilinen sunucu durumuna dönülür. İstenen durum zaten
 * yürürlükteyse hiçbir şey yapmaz — gereksiz render üretmez.
 */
export function applyConversationLike(conversationId: string, liked: boolean) {
  const state = store.getState().conversation;
  if (state.likedConversationIds.includes(conversationId) === liked) return;
  const delta = liked ? 1 : -1;
  const bump = (items: Conversation[]) => items.map(item => item.id === conversationId
    ? { ...item, likesCount: Math.max(0, (item.likesCount || 0) + delta) }
    : item);
  store.dispatch(patchConversation({
    likedConversationIds: liked
      ? [...state.likedConversationIds, conversationId]
      : state.likedConversationIds.filter(id => id !== conversationId),
    conversations: bump(state.conversations),
    userConversations: bump(state.userConversations),
    ...(state.currentConversation?.id === conversationId
      ? {
        currentConversation: {
          ...state.currentConversation,
          likesCount: Math.max(0, (state.currentConversation.likesCount || 0) + delta),
        },
      }
      : {}),
  }));
}

export async function likeConversation(conversationId: string) {
  const userId = store.getState().auth.user?.id;
  if (!userId) return { success: false, error: i18n.t('errors.userNotFound') };
  const previous = store.getState().conversation.likedConversationIds.includes(conversationId);
  const desired = !previous;
  applyConversationLike(conversationId, desired);
  const db = getFirestore();
  void setLikeState({
    key: `conversation:${conversationId}`,
    userId,
    desired,
    previous,
    targets: {
      counter: doc(db, 'conversations', conversationId),
      like: doc(db, 'conversations', conversationId, 'likes', userId),
      userLike: doc(db, 'users', userId, 'likedConversations', conversationId),
      userLikeData: { conversationId },
    },
    onLiked: () => notifyConversationLike(conversationId, userId),
  }).then(outcome => {
    // Hata: ters çevirme yok, zincir başlamadan önceki duruma dön.
    if (!outcome.ok) applyConversationLike(conversationId, outcome.previous);
  });
  return { success: true };
}

export function cleanupConversationLikes() {
  listener.unsubscribe?.();
  listener.unsubscribe = null;
  listener.userId = null;
}
