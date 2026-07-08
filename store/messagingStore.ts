import { listenThreads, markThreadRead, sendMessage } from '@/features/messaging/services/messagingService';
import { getUserById } from '@/features/story/services/userCache';
import { MessageThread } from '@/types';
import { store } from './index';
import { patchMessaging } from './slices/messagingSlice';

export type { MessagingState } from './slices/messagingSlice';

// Kullanıcının sohbet listesi için global real-time dinleyici. Ana ekrandaki
// okunmamış rozeti + Mesajlar kutusu aynı slice'ı okur. Dinleyici idempotent:
// yeniden başlatınca öncekini kapatır.
let threadsUnsub: (() => void) | null = null;
let threadsUserId: string | null = null;

// Firestore Timestamp | Date | null → ms (sıralama için).
const toMs = (ts: any): number =>
  ts?.toMillis ? ts.toMillis() : ts?.toDate ? ts.toDate().getTime() : 0;

export const messagingActions = {
  // Katılımcı listesindeki karşı tarafı çözüp thread'i UI için zenginleştir.
  async _mapThreads(
    userId: string,
    docs: { id: string; data: any }[]
  ): Promise<MessageThread[]> {
    return Promise.all(
      docs.map(async (d) => {
        const otherId = (d.data.participants || []).find((p: string) => p !== userId);
        const otherUser = otherId ? await getUserById(otherId) : null;
        const unreadMap = d.data.unread || {};
        return {
          id: d.id,
          participants: d.data.participants || [],
          lastMessage: d.data.lastMessage || null,
          updatedAt: d.data.updatedAt || null,
          otherUser,
          unread: typeof unreadMap[userId] === 'number' ? unreadMap[userId] : 0,
        } as MessageThread;
      })
    );
  },

  // Global thread dinleyicisini başlat (aynı kullanıcı için no-op).
  startThreadsListener(userId: string) {
    if (!userId) return;
    if (threadsUnsub && threadsUserId === userId) return;
    if (threadsUnsub) threadsUnsub();
    threadsUserId = userId;

    threadsUnsub = listenThreads(userId, async (docs) => {
      const threads = await messagingActions._mapThreads(userId, docs);
      // En yeni sohbet önde. (Composite index gerekmesin diye sıralama burada.)
      threads.sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt));
      store.dispatch(patchMessaging({ threads, threadsLoaded: true }));
    });
  },

  stopThreadsListener() {
    if (threadsUnsub) threadsUnsub();
    threadsUnsub = null;
    threadsUserId = null;
    store.dispatch(patchMessaging({ threads: [], threadsLoaded: false }));
  },

  // Mesaj gönder (optimistic akış hook tarafında; burası arka plan yazımı).
  // Push bildirimi VPS'teki push-worker'ın işi — messages alt koleksiyonunu
  // dinler (bkz. YAPILACAKLAR 3.1, server/push-worker/).
  async send(senderId: string, recipientId: string, text: string, image?: string) {
    await sendMessage({ senderId, recipientId, text, image });
  },

  async markRead(threadId: string, userId: string) {
    return markThreadRead(threadId, userId);
  },
};
