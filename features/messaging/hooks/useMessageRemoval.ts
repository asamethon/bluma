import { useCallback } from 'react';
import { Alert } from 'react-native';
import { store } from '@/store';
import { messagingActions } from '@/store/messagingStore';
import { rollbackMessageRemoval } from '@/store/slices/chatSlice';
import { animateRemoval } from '../services/chatMessages';
import { cancelRemovalAnimation } from '../services/messageRemovalAnimation';
import type { RemovalScope } from '../utils/messageVisibility';

export function useMessageRemoval(threadId: string | null, userId?: string) {
  return useCallback((messageId: string, scope: RemovalScope) => {
    if (!threadId || !userId) return;
    const chat = store.getState().chat[threadId];
    const message = chat?.messages.find(m => m.id === messageId);
    if (!message || chat.removals[messageId] || message.pending) return;
    animateRemoval(threadId, message, scope);
    const write = scope === 'everyone'
      ? messagingActions.deleteMessage(threadId, messageId)
      : messagingActions.hideMessage(threadId, messageId, userId);
    void write.catch(() => {
      cancelRemovalAnimation(threadId, messageId);
      store.dispatch(rollbackMessageRemoval({ threadId, messageId }));
      Alert.alert('Mesaj silinemedi', 'Mesaj geri getirildi. Lütfen tekrar dene.');
    });
  }, [threadId, userId]);
}
