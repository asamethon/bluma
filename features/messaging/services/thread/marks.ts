import {
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { logger } from '@/utils/logger';
import { activityVisible, threadIdFor, threadRef } from './refs';

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
