import i18n from '@/i18n';
import { store } from '@/store';
import { patchConversation } from '@/store/slices/conversationSlice';
import type { Conversation } from '@/types';
import { logger } from '@/utils/logger';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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

export function toggleLikeConversationUI(conversationId: string) {
  const state = store.getState().conversation;
  const liked = state.likedConversationIds.includes(conversationId);
  const delta = liked ? -1 : 1;
  const bump = (items: Conversation[]) => items.map(item => item.id === conversationId
    ? { ...item, likesCount: Math.max(0, (item.likesCount || 0) + delta) }
    : item);
  store.dispatch(patchConversation({
    likedConversationIds: liked
      ? state.likedConversationIds.filter(id => id !== conversationId)
      : [...state.likedConversationIds, conversationId],
    conversations: bump(state.conversations),
    userConversations: bump(state.userConversations),
    ...(state.currentConversation?.id === conversationId
      ? { currentConversation: { ...state.currentConversation, likesCount: Math.max(0, state.currentConversation.likesCount + delta) } }
      : {}),
  }));
}

export async function performLikeConversationFirebaseOperation(conversationId: string, userId: string) {
  try {
    const db = getFirestore();
    const conversation = doc(db, 'conversations', conversationId);
    const like = doc(db, 'conversations', conversationId, 'likes', userId);
    const savedLike = doc(db, 'users', userId, 'likedConversations', conversationId);
    const liked = (await getDoc(like)).exists();
    if (liked) {
      await Promise.all([deleteDoc(like), deleteDoc(savedLike), updateDoc(conversation, { likesCount: increment(-1) })]);
      return;
    }
    await Promise.all([
      setDoc(like, { userId, createdAt: serverTimestamp() }),
      setDoc(savedLike, { conversationId, createdAt: serverTimestamp() }),
      updateDoc(conversation, { likesCount: increment(1) }),
    ]);
    void notifyConversationLike(conversationId, userId);
  } catch (error) {
    logger.error('Firebase like operation error:', error);
    toggleLikeConversationUI(conversationId);
  }
}

export async function likeConversation(conversationId: string) {
  const userId = store.getState().auth.user?.id;
  if (!userId) return { success: false, error: i18n.t('errors.userNotFound') };
  toggleLikeConversationUI(conversationId);
  void performLikeConversationFirebaseOperation(conversationId, userId);
  return { success: true };
}

export function cleanupConversationLikes() {
  listener.unsubscribe?.();
  listener.unsubscribe = null;
  listener.userId = null;
}
