import { store } from '@/store';
import { finishMessageRemoval, receiveMessages, startMessageRemoval } from '@/store/slices/chatSlice';
import type { DirectMessage } from '@/types';
import { isMessageVisible } from '../utils/messageVisibility';
import { playRemovalAnimation } from './messageRemovalAnimation';
import { listenMessages } from './thread/listeners';

const listeners = new Map<string, { unsubscribe: () => void; users: number }>();

export function animateRemoval(threadId: string, message: DirectMessage, scope?: 'everyone' | 'self') {
  if (store.getState().chat[threadId]?.removals[message.id]) return;
  store.dispatch(startMessageRemoval({ threadId, removal: { message, animating: true, scope } }));
  const finish = () => {
    store.dispatch(finishMessageRemoval({ threadId, messageId: message.id }));
  };
  void playRemovalAnimation(threadId, message.id).then(finish, finish);
}

/** Aynı sohbet için tek dinleyici; uzak silmeler de ekrandaki özgün baloncuğu dağıtır. */
export function subscribeChatMessages(threadId: string, userId: string) {
  const key = `${threadId}/${userId}`;
  const existing = listeners.get(key);
  const listener = existing ?? { users: 0, unsubscribe: () => {} };
  if (!existing) {
    listeners.set(key, listener);
    listener.unsubscribe = listenMessages(threadId, messages => {
      const previous = store.getState().chat[threadId]?.messages ?? [];
      const previousById = new Map(previous.map(m => [m.id, m]));
      messages.forEach(message => {
        const old = previousById.get(message.id);
        if (old && isMessageVisible(old, userId) && !isMessageVisible(message, userId)) {
          animateRemoval(threadId, old);
        }
      });
      store.dispatch(receiveMessages({ threadId, messages }));
    });
  }
  listener.users += 1;
  return () => {
    listener.users -= 1;
    if (!listener.users) { listener.unsubscribe(); listeners.delete(key); }
  };
}
