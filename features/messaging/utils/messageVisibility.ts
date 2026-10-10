import type { DirectMessage } from '@/types';
import { toMillis } from './time';

export type RemovalScope = 'everyone' | 'self';
export type MessageRemoval = { message: DirectMessage; animating: boolean; scope?: RemovalScope };

export const isMessageVisible = (message: DirectMessage, userId?: string, hiddenBefore = 0) => (
  !message.deletedAt && !(userId && message.hiddenFor?.[userId])
  && (!hiddenBefore || toMillis(message.createdAt) > hiddenBefore)
);

/** Çıkış görüntüsü yalnızca animasyon bitene kadar yaşar; alıntılar anında temizlenir. */
export function visibleMessages(
  messages: DirectMessage[], pending: DirectMessage[], removals: Record<string, MessageRemoval>,
  userId?: string, hiddenBefore = 0,
) {
  const hidden = new Set(messages.filter(m => !isMessageVisible(m, userId, hiddenBefore)).map(m => m.id));
  Object.keys(removals).forEach(id => hidden.add(id));
  const visible = [...messages, ...pending].filter(m => !hidden.has(m.id));
  Object.values(removals).forEach(removal => {
    if (removal.animating) visible.push(removal.message);
  });
  return visible.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)).map(message => (
    message.replyTo && hidden.has(message.replyTo.id) ? { ...message, replyTo: undefined } : message
  ));
}
