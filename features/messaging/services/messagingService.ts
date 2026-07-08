import { DirectMessage } from '@/types';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  increment,
  onSnapshot,
  orderBy,
  query,
  // orderBy: mesajlar için (thread-içi). Thread listesi array-contains ile
  // sorgulanır; composite index gerekmesin diye sıralama istemci tarafında.
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';

// Direct-messaging Firestore erişimi. SADECE veri katmanı: React/Redux yok.
// Koleksiyon: messageThreads/{threadId} + messageThreads/{threadId}/messages.
// (Forum "conversations" koleksiyonundan tamamen ayrı.)

// İki kullanıcı için deterministik thread ID — sıralı birleştirme sayesinde
// A→B ve B→A aynı thread'e düşer, çift sohbet oluşmaz.
export function threadIdFor(a: string, b: string): string {
  return [a, b].sort().join('_');
}

const threadRef = (threadId: string) =>
  doc(getFirestore(), 'messageThreads', threadId);
const messagesRef = (threadId: string) =>
  collection(getFirestore(), 'messageThreads', threadId, 'messages');

// Mevcut kullanıcının tüm sohbetlerini gerçek zamanlı dinler (en yeni önde).
// Idempotent değildir; dönen unsubscribe çağıranca kapatılır.
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

// Tek bir thread'in mesajlarını gerçek zamanlı dinler (eskiden yeniye).
export function listenMessages(
  threadId: string,
  cb: (messages: DirectMessage[]) => void
): () => void {
  const q = query(messagesRef(threadId), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const messages = snap
        ? snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as DirectMessage))
        : [];
      cb(messages);
    },
    () => cb([])
  );
}

// Mesaj gönder: thread'i oluştur/güncelle + mesajı ekle. Sayaçlar atomik
// increment ile: alıcının okunmamışı +1, gönderenin okunmamışı 0'lanır.
export async function sendMessage(params: {
  senderId: string;
  recipientId: string;
  text: string;
  image?: string;
}): Promise<void> {
  const { senderId, recipientId, text, image } = params;
  const threadId = threadIdFor(senderId, recipientId);
  const db = getFirestore();
  const batch = writeBatch(db);
  const previewText = text || (image ? '📷 Fotoğraf' : '');
  // participants deterministik sırada tutulur (threadIdFor ile aynı) — aksi
  // halde güncelleme kuralı (rules'ta `participants == resource.data.participants`)
  // karşı taraf ilk yazdığında/cevapladığında sıra farkı yüzünden fail veriyor
  // ve batch.commit() throw ediyor, mesaj hiç gönderilmemiş görünüyor.
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
    createdAt: serverTimestamp(),
  });
}

// Kullanıcı thread'i açtığında okunmamış sayacını sıfırla. Thread henüz yoksa
// (hiç mesaj yoksa) sessizce geç.
export async function markThreadRead(threadId: string, userId: string): Promise<void> {
  try {
    await updateDoc(threadRef(threadId), { [`unread.${userId}`]: 0 });
  } catch {
    // doküman yok / yetki — okunmamış zaten yoktur, yut.
  }
}

// Yazma durumu ("...") — thread doc'una senderId için son yazım timestamp'i
// yazılır. Karşı taraf bu alanı dinler, 5 sn içindeyse balonlu ipucu gösterir.
// Throttle çağrı yerinde (useChat) yapılır; burada tek yazım.
// setDoc + merge kullanmamızın sebebi: thread henüz oluşmamışsa (ilk mesaj
// atılmadan yazılmaya başlanırsa) doc'u create edebilmek — bu yüzden
// participants'ı da (deterministik sırada) veriyoruz, yoksa create rule fail
// verir.
export async function setTypingStatus(params: {
  senderId: string;
  recipientId: string;
  isTyping: boolean;
}): Promise<void> {
  const { senderId, recipientId, isTyping } = params;
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
  } catch {
    // Ağ / yetki hatası — typing indicator kritik değil, sessiz geç.
  }
}

// Yalnızca thread doc'unu dinler (typing alanı için). Mesajlar için
// listenMessages, thread listesi için listenThreads ayrı.
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

// Boş bir sohbet açıldığında thread yaratmaya gerek yok: ilk mesajla oluşur.
export const messagingService = {
  threadIdFor,
  listenThreads,
  listenMessages,
  listenThreadDoc,
  sendMessage,
  markThreadRead,
  setTypingStatus,
};
