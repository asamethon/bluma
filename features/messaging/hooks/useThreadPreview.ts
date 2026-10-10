import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import type { MessageThread } from '@/types';
import { listenVisiblePreview } from '../services/thread/preview';
import { isMessageVisible } from '../utils/messageVisibility';
import { messagePreviewText } from '../utils/messagePreview';

export function useThreadPreview(thread: MessageThread, userId?: string) {
  const { id, hiddenBefore = 0 } = thread;
  const preview = useAppSelector(s => s.messaging.previews[`${id}/${userId}`]);
  const removing = useAppSelector(s => preview ? !!s.chat[id]?.removals[preview.id] : false);
  const fallback = useAppSelector(s => removing ? s.chat[id]?.messages.findLast(m => (
    !s.chat[id].removals[m.id] && isMessageVisible(m, userId, hiddenBefore)
  )) : undefined);
  useEffect(() => {
    if (userId) return listenVisiblePreview(id, userId, hiddenBefore);
  }, [id, userId, hiddenBefore]);
  const message = removing ? fallback : preview;
  return message ? { ...message, text: messagePreviewText(message) } : null;
}
