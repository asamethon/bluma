import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { subscribeReplySource } from '../services/thread/replySource';
import { isMessageVisible } from '../utils/messageVisibility';

/** Pencere dışındaki eski alıntılar da özgün mesajın silinmesini izler. */
export function useReplyVisibility(threadId: string, messageId?: string) {
  const userId = useAppSelector(s => s.auth.user?.id);
  const source = useAppSelector(s => messageId
    ? s.chat[threadId]?.messages.find(m => m.id === messageId) ?? s.messaging.replySources[`${threadId}/${messageId}`]
    : undefined);
  const removing = useAppSelector(s => messageId ? !!s.chat[threadId]?.removals[messageId] : false);
  useEffect(() => {
    if (threadId && messageId) return subscribeReplySource(threadId, messageId);
  }, [threadId, messageId]);
  return !!source && !removing && isMessageVisible(source, userId);
}
