import { messagePreviewText } from '../../utils/messagePreview';
import type { MessageGif, MessageReply, SharedStory, VoiceMessage } from '@/types';
import {
  addDoc,
  doc,
  getFirestore,
  increment,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import { messagesRef, threadIdFor, threadRef } from './refs';
import { assertEmailVerified } from '@/features/auth/services/emailVerification';

export type SendMessageParams = {
  senderId: string;
  recipientId: string;
  text: string;
  image?: string;
  story?: SharedStory;
  replyTo?: MessageReply;
  voice?: VoiceMessage;
  gif?: MessageGif;
  /** Tek seferlik fotoğraf: alıcı bir kez açtıktan sonra bir daha gösterilmez. */
  viewOnce?: boolean;
  clientId?: string;
};

export async function sendMessage(params: SendMessageParams): Promise<void> {
  // Kapı BURADA, çağıran tarafta değil: hikâye paylaşımı (ShareStorySheet)
  // besteci hook'undan geçmiyor ve kapıyı atlıyordu. Kurallar sunucuda yine
  // reddederdi ama kullanıcı sebebini göremeden sessizce başarısız olurdu.
  const verified = await assertEmailVerified();
  if (!verified.ok) throw new Error(verified.error);

  const {
    senderId, recipientId, text, image, story, replyTo, viewOnce, voice, gif, clientId,
  } = params;
  const threadId = threadIdFor(senderId, recipientId);
  const db = getFirestore();
  const batch = writeBatch(db);
  const participants = [senderId, recipientId].sort();

  batch.set(
    threadRef(threadId),
    {
      participants,
      lastMessage: { text: messagePreviewText(params), senderId, createdAt: serverTimestamp() },
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
    ...(viewOnce ? { viewOnce: true, openedAt: null } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(voice ? { voice: { url: voice.url, durationMs: voice.durationMs } } : {}),
    ...(gif
      ? {
          gif: {
            url: gif.url,
            width: gif.width,
            height: gif.height,
            ...(gif.sticker ? { sticker: true } : {}),
          },
        }
      : {}),
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

/**
 * Tek seferlik fotoğrafı "açıldı" olarak damgalar. Kurallar bu alanı yalnızca
 * ALICIYA ve yalnızca bir kez yazdırır; damga düştükten sonra görsel iki
 * tarafta da gösterilmez.
 */
export async function markMessageOpened(threadId: string, messageId: string): Promise<void> {
  await updateDoc(doc(getFirestore(), 'messageThreads', threadId, 'messages', messageId), {
    openedAt: serverTimestamp(),
  });
}
