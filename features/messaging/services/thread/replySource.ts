import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { store } from '@/store';
import { setReplySource } from '@/store/slices/messagingSlice';
import type { DirectMessage } from '@/types';
import { messagesRef } from './refs';

const subscriptions = new Map<string, { users: number; unsubscribe: () => void }>();

export function subscribeReplySource(threadId: string, messageId: string) {
  const key = `${threadId}/${messageId}`;
  const subscription = subscriptions.get(key) ?? { users: 0, unsubscribe: () => {} };
  if (!subscriptions.has(key)) {
    subscriptions.set(key, subscription);
    subscription.unsubscribe = onSnapshot(doc(messagesRef(threadId), messageId), snapshot => {
      const message = snapshot.exists() ? { ...snapshot.data(), id: messageId } as DirectMessage : null;
      store.dispatch(setReplySource({ key, message }));
    }, () => store.dispatch(setReplySource({ key, message: null })));
  }
  subscription.users += 1;
  return () => {
    subscription.users -= 1;
    if (!subscription.users) { subscription.unsubscribe(); subscriptions.delete(key); }
  };
}
