import {
  deleteMessageForEveryone,
  editMessageText,
  hideMessageForUser,
  hideThreadForUser,
  listenThreads,
  markMessageOpened,
  markThreadRead,
  sendMessage,
  type SendMessageParams,
} from '@/features/messaging/services/messagingService';
import { getUserById } from '@/features/story/services/userCache';
import { MessageThread, SharedStory } from '@/types';
import { store } from './index';
import { patchMessaging } from './slices/messagingSlice';
import { clearChatMessages } from './slices/chatSlice';

const threadsListener = {
  unsubscribe: null as (() => void) | null,
  userId: null as string | null,
};

const toMs = (ts: any): number =>
  ts?.toMillis ? ts.toMillis() : ts?.toDate ? ts.toDate().getTime() : 0;

export const messagingActions = {
  // Kullanıcının "benim için sil" dediği sohbetler, o andan sonra yeni bir
  // mesaj gelmediği sürece listede görünmez.
  _isHidden(userId: string, data: any): boolean {
    const hiddenAt = toMs(data?.deletedFor?.[userId]);
    return hiddenAt > 0 && toMs(data?.updatedAt) <= hiddenAt;
  },

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
          hiddenBefore: toMs(d.data.deletedFor?.[userId]),
          otherUser,
          unread: typeof unreadMap[userId] === 'number' ? unreadMap[userId] : 0,
        } as MessageThread;
      })
    );
  },

  startThreadsListener(userId: string) {
    if (!userId) return;
    if (threadsListener.unsubscribe && threadsListener.userId === userId) return;
    if (threadsListener.unsubscribe) threadsListener.unsubscribe();
    threadsListener.userId = userId;

    threadsListener.unsubscribe = listenThreads(userId, async (docs) => {
      const visible = docs.filter((d) => !messagingActions._isHidden(userId, d.data));
      const threads = await messagingActions._mapThreads(userId, visible);
      threads.sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt));
      store.dispatch(patchMessaging({ threads, threadsLoaded: true }));
    });
  },

  stopThreadsListener() {
    if (threadsListener.unsubscribe) threadsListener.unsubscribe();
    threadsListener.unsubscribe = null;
    threadsListener.userId = null;
    store.dispatch(patchMessaging({ threads: [], threadsLoaded: false, previews: {}, replySources: {} }));
    store.dispatch(clearChatMessages());
  },

  async send(params: SendMessageParams) {
    await sendMessage(params);
  },

  /** Tek seferlik fotoğraf alıcı tarafından açıldı. */
  async openViewOnce(threadId: string, messageId: string) {
    return markMessageOpened(threadId, messageId);
  },

  async editMessage(threadId: string, messageId: string, text: string) {
    return editMessageText(threadId, messageId, text);
  },

  async deleteMessage(threadId: string, messageId: string) {
    return deleteMessageForEveryone(threadId, messageId);
  },

  async hideMessage(threadId: string, messageId: string, userId: string) {
    return hideMessageForUser(threadId, messageId, userId);
  },

  async sendStory(senderId: string, recipientId: string, story: SharedStory) {
    await sendMessage({ senderId, recipientId, text: '', story });
  },

  async markRead(threadId: string, userId: string) {
    return markThreadRead(threadId, userId);
  },

  // İyimser: sohbet önce listeden düşer, yazma başarısız olursa dinleyici geri getirir.
  async hideThread(threadId: string, userId: string) {
    const { threads } = store.getState().messaging;
    store.dispatch(patchMessaging({ threads: threads.filter((t) => t.id !== threadId) }));
    return hideThreadForUser(threadId, userId);
  },
};
