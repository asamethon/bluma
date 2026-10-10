import { useCanMessage } from '@/features/privacy/hooks/useCanMessage';
import { usePresence } from '@/features/privacy/hooks/usePresence';
import { useAppSelector } from '@/store/hooks';
import { messagingActions } from '@/store/messagingStore';
import { useCallback } from 'react';
import { useChatComposer } from './useChatComposer';
import { useChatThread } from './useChatThread';
import { useVoiceRecorder } from './useVoiceRecorder';
import { useTypingSignal } from './useTypingSignal';
import { useMessageRemoval } from './useMessageRemoval';

/** Sohbet ekranının tek giriş noktası: akış + yazıyor göstergesi + besteci. */
export function useChat(otherUserId?: string) {
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  // Karşı taraf mesajları kapattıysa besteci kilitlenir (kurallar da reddeder).
  const { blocked: messagingBlocked } = useCanMessage(otherUserId);
  const presence = usePresence(otherUserId);

  const thread = useChatThread(currentUserId, otherUserId);
  const typing = useTypingSignal(currentUserId, otherUserId);
  const composer = useChatComposer({
    currentUserId,
    otherUserId,
    threadId: thread.threadId,
    messagingBlocked,
    addPending: thread.addPending,
    dropPending: thread.dropPending,
    stopTyping: typing.stop,
  });

  const voice = useVoiceRecorder(composer.sendVoice);
  const removeMessage = useMessageRemoval(thread.threadId, currentUserId);

  const openViewOnce = useCallback((messageId: string) => {
    if (thread.threadId) void messagingActions.openViewOnce(thread.threadId, messageId);
  }, [thread.threadId]);

  const hideMessage = useCallback((messageId: string) => {
    removeMessage(messageId, 'self');
  }, [removeMessage]);

  const deleteMessage = useCallback((messageId: string) => {
    removeMessage(messageId, 'everyone');
  }, [removeMessage]);

  return {
    currentUserId,
    threadId: thread.threadId,
    deleteMessage,
    hideMessage,
    openViewOnce,
    voice,
    otherUser: thread.otherUser,
    messages: thread.messages,
    otherTyping: thread.otherTyping,
    deliveredUntil: thread.deliveredUntil,
    readUntil: thread.readUntil,
    messagingBlocked,
    presence,
    ...composer,
    setDraft: (text: string) => {
      composer.setDraft(text);
      if (text) typing.ping();
      else typing.stop();
    },
  };
}
