import { limitToLast, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { store } from '@/store';
import { setThreadPreview } from '@/store/slices/messagingSlice';
import type { DirectMessage } from '@/types';
import { isMessageVisible } from '../../utils/messageVisibility';
import { messagesRef } from './refs';
import { toMillis } from '../../utils/time';

const subscriptions = new Map<string, { users: number; unsubscribe: () => void }>();

/** Önizleme asıl mesajdan gelir: silinen içerik thread'deki eski kopyadan sızmaz. */
export function listenVisiblePreview(threadId: string, userId: string, hiddenBefore: number) {
  const key = `${threadId}/${userId}/${hiddenBefore}`;
  const existing = subscriptions.get(key);
  if (existing) {
    existing.users += 1;
    return () => release(key, existing);
  }
  const lifecycle = { active: true, unsubscribe: () => {} };
  const subscribe = (count: number) => {
    lifecycle.unsubscribe();
    lifecycle.unsubscribe = onSnapshot(query(messagesRef(threadId), orderBy('createdAt', 'asc'), limitToLast(count)), snap => {
      if (!lifecycle.active) return;
      const messages = snap.docs.map(d => ({ ...d.data(), id: d.id } as DirectMessage));
      const message = messages.findLast(m => isMessageVisible(m, userId, hiddenBefore)) ?? null;
      store.dispatch(setThreadPreview({ key: `${threadId}/${userId}`, message }));
      // Normal durumda yalnızca son mesaj okunur. Silinmiş kuyrukta geriye ilerle.
      const reachedHiddenHistory = hiddenBefore > 0 && toMillis(messages.at(-1)?.createdAt) <= hiddenBefore;
      if (!message && snap.size === count && !reachedHiddenHistory) subscribe(count * 2);
    }, () => store.dispatch(setThreadPreview({ key: `${threadId}/${userId}`, message: null })));
  };
  subscribe(1);
  const subscription = { users: 1, unsubscribe: () => { lifecycle.active = false; lifecycle.unsubscribe(); } };
  subscriptions.set(key, subscription);
  return () => release(key, subscription);
}

function release(key: string, subscription: { users: number; unsubscribe: () => void }) {
  subscription.users -= 1;
  if (!subscription.users) { subscription.unsubscribe(); subscriptions.delete(key); }
}
