import { getUserById } from '@/features/auth/services/userCache';
import { store } from '@/store';
import { patchNotification } from '@/store/slices/notificationSlice';
import type { Notification } from '@/types';
import { logger } from '@/utils/logger';
import { collection, getFirestore, limit, onSnapshot, orderBy, query, where } from '@react-native-firebase/firestore';
import { loadNotificationSettings } from './notificationRepository';

const lifecycle = {
  revision: 0,
  unsubscribe: null as (() => void) | null,
  userId: null as string | null,
};

async function withSenderInfo(notifications: Notification[]) {
  const senderIds = Array.from(new Set(notifications.map(item => item.senderId).filter(Boolean)));
  const entries = await Promise.all(senderIds.map(async id => [id, await getUserById(id).catch(() => null)] as const));
  const senders = new Map(entries);
  return notifications.map(notification => {
    const sender = senders.get(notification.senderId);
    return sender ? {
      ...notification,
      senderName: sender.displayName || sender.username,
      senderAvatar: sender.profileImage,
    } : notification;
  });
}

export async function initializeNotifications(userId: string) {
  try {
    if (lifecycle.unsubscribe && lifecycle.userId === userId) return lifecycle.unsubscribe;
    lifecycle.unsubscribe?.();
    lifecycle.userId = userId;
    store.dispatch(patchNotification({ isLoading: true }));
    const source = query(
      collection(getFirestore(), 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    lifecycle.unsubscribe = onSnapshot(source, snapshot => {
      const notifications = snapshot?.docs.map(item => ({ id: item.id, ...item.data() }) as Notification) ?? [];
      const unreadCount = notifications.filter(item => !item.isRead).length;
      lifecycle.revision += 1;
      const revision = lifecycle.revision;
      store.dispatch(patchNotification({ notifications, unreadCount }));
      void withSenderInfo(notifications).then(enriched => {
        if (revision === lifecycle.revision) store.dispatch(patchNotification({ notifications: enriched }));
      });
    }, error => logger.error('Notifications listener error:', error));
    await loadNotificationSettings(userId);
    store.dispatch(patchNotification({ isLoading: false }));
    return lifecycle.unsubscribe;
  } catch (error) {
    logger.error('Initialize notifications error:', error);
    store.dispatch(patchNotification({ isLoading: false }));
  }
}

export function cleanupNotificationsListener() {
  lifecycle.unsubscribe?.();
  lifecycle.unsubscribe = null;
  lifecycle.userId = null;
  lifecycle.revision += 1;
}
