import type { DirectMessage } from '@/types';
import {
  collection,
  getFirestore,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import { messagesRef } from './refs';

export function listenThreads(
  userId: string,
  cb: (docs: { id: string; data: any }[]) => void
): () => void {
  const q = query(
    collection(getFirestore(), 'messageThreads'),
    where('participants', 'array-contains', userId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap ? snap.docs.map((d) => ({ id: d.id, data: d.data() })) : [];
      cb(docs);
    },
    () => cb([])
  );
}

const MESSAGE_WINDOW = 100;

export function listenMessages(
  threadId: string,
  cb: (messages: DirectMessage[]) => void
): () => void {
  let cancelled = false;
  let unsub: (() => void) | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const subscribe = () => {
    if (cancelled) return;
    const q = query(messagesRef(threadId), orderBy('createdAt', 'asc'), limitToLast(MESSAGE_WINDOW));
    unsub = onSnapshot(
      q,
      (snap) => {
        const messages = snap
          ? snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as DirectMessage))
          : [];
        cb(messages);
      },
      () => {
        if (unsub) { unsub(); unsub = null; }
        if (cancelled) return;
        retry = setTimeout(subscribe, 1500);
      }
    );
  };

  subscribe();

  return () => {
    cancelled = true;
    if (retry) clearTimeout(retry);
    if (unsub) unsub();
  };
}
