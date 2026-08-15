import i18n from '@/i18n';
import { DirectMessage, SharedStory } from '@/types';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  increment,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
import { logger } from '@/utils/logger';
import { store } from '@/store';
import { privacyOf } from '@/features/privacy/types';

// "Etkinlik Durumu" kapalıyken yazıyor göstergesi ve okundu filigranı
// karşı tarafa hiç gönderilmez.
function activityVisible(): boolean {
  return privacyOf(store.getState().auth.user).showActivity;
}

export function threadIdFor(a: string, b: string): string {
  return [a, b].sort().join('_');
}

const threadRef = (threadId: string) =>
  doc(getFirestore(), 'messageThreads', threadId);
const messagesRef = (threadId: string) =>
  collection(getFirestore(), 'messageThreads', threadId, 'messages');

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

export async function sendMessage(params: {
  senderId: string;
  recipientId: string;
  text: string;
  image?: string;
  story?: SharedStory;
  clientId?: string;
}): Promise<void> {
  const { senderId, recipientId, text, image, story, clientId } = params;
  const threadId = threadIdFor(senderId, recipientId);
  const db = getFirestore();
  const batch = writeBatch(db);
  const previewText = text || (story ? i18n.t('messages.sharedStoryPreview') : image ? i18n.t('messages.photoPreview') : '');
  const participants = [senderId, recipientId].sort();

  batch.set(
    threadRef(threadId),
    {
      participants,
      lastMessage: { text: previewText, senderId, createdAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
      unread: { [recipientId]: increment(1), [senderId]: 0 },
    },
    { merge: true }
  );
  await batch.commit();

  await addDoc(messagesRef(threadId), {
    senderId,
    text,
    ...(image ? { image } : {}),
    ...(story
      ? {
          story: {
            id: story.id,
            title: story.title,
            ...(story.coverImage ? { coverImage: story.coverImage } : {}),
            ...(story.authorName ? { authorName: story.authorName } : {}),
          },
        }
      : {}),
    ...(clientId ? { clientId } : {}),
    createdAt: serverTimestamp(),
  });
}

export async function markThreadRead(threadId: string, userId: string): Promise<void> {
  try {
    await updateDoc(threadRef(threadId), {
      [`unread.${userId}`]: 0,
      // Karşı tarafın mavi çift tik görebilmesi için okundu filigranı —
      // etkinlik durumu kapalıysa yazılmaz (okunmamış sayacı yine sıfırlanır).
      ...(activityVisible() ? { [`lastRead.${userId}`]: serverTimestamp() } : {}),
    });
  } catch (e) {
    logger.error('Mark thread read error:', e);
  }
}

// Sohbeti YALNIZCA bu kullanıcı için gizler: thread iki kişilik olduğundan
// gerçek silme karşı tarafın da geçmişini yok ederdi (kurallarda delete kapalı).
// Filigranın altındaki mesajlar istemcide filtrelenir; yeni bir mesaj gelirse
// updatedAt filigranı geçer ve sohbet listede kendiliğinden geri gelir.
export async function hideThreadForUser(threadId: string, userId: string): Promise<void> {
  await updateDoc(threadRef(threadId), {
    [`deletedFor.${userId}`]: serverTimestamp(),
    [`unread.${userId}`]: 0,
  });
}

export async function setTypingStatus(params: {
  senderId: string;
  recipientId: string;
  isTyping: boolean;
}): Promise<void> {
  const { senderId, recipientId, isTyping } = params;
  // Yazıyor göstergesi de bir etkinlik sinyalidir.
  if (isTyping && !activityVisible()) return;
  const threadId = threadIdFor(senderId, recipientId);
  const participants = [senderId, recipientId].sort();
  try {
    await setDoc(
      threadRef(threadId),
      {
        participants,
        typing: { [senderId]: isTyping ? serverTimestamp() : null },
      },
      { merge: true }
    );
  } catch (e) {
    logger.error('Set typing status error:', e);
  }
}

export function listenThreadDoc(
  threadId: string,
  cb: (data: any | null) => void
): () => void {
  return onSnapshot(
    threadRef(threadId),
    (snap) => cb(snap && snap.exists() ? snap.data() : null),
    () => cb(null)
  );
}

export const messagingService = {
  threadIdFor,
  listenThreads,
  listenMessages,
  listenThreadDoc,
  sendMessage,
  markThreadRead,
  hideThreadForUser,
  setTypingStatus,
};
