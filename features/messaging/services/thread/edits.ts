import {
  deleteField,
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore';

/** Düzenlemeye izin verilen süre (WhatsApp'taki gibi); kurallar da bunu uygular. */
export const EDIT_WINDOW_MS = 15 * 60 * 1000;

const messageRef = (threadId: string, messageId: string) =>
  doc(getFirestore(), 'messageThreads', threadId, 'messages', messageId);

/** Metni değiştirir ve düzenlenme damgası düşer. Yalnızca gönderen yapabilir. */
export async function editMessageText(threadId: string, messageId: string, text: string) {
  await updateDoc(messageRef(threadId, messageId), {
    text,
    editedAt: serverTimestamp(),
  });
}

/**
 * "Herkesten sil": içerik gerçekten temizlenir (metin boşalır, medya alanları
 * dokümandan silinir), yerinde yalnızca silinme damgası kalır.
 */
export async function deleteMessageForEveryone(threadId: string, messageId: string) {
  await updateDoc(messageRef(threadId, messageId), {
    deletedAt: serverTimestamp(),
    text: '',
    image: deleteField(),
    voice: deleteField(),
    gif: deleteField(),
    story: deleteField(),
  });
}

/** "Benden sil": karşı tarafın geçmişine dokunmadan yalnızca bu kişiye gizler. */
export async function hideMessageForUser(threadId: string, messageId: string, userId: string) {
  await updateDoc(messageRef(threadId, messageId), {
    [`hiddenFor.${userId}`]: true,
  });
}
