import { store } from '@/store';
import { patchNotification } from '@/store/slices/notificationSlice';
import type { Notification, NotificationSettings } from '@/types';
import { logger } from '@/utils/logger';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';

export type NotificationInput = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;

const compact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(compact);
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== null && item !== '')
      .map(([key, item]) => [key, compact(item)]),
  );
};

export async function createNotification(notification: NotificationInput) {
  try {
    const reference = doc(collection(getFirestore(), 'notifications'));
    await setDoc(reference, compact({ ...notification, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  } catch (error) {
    logger.error('Create notification error:', error);
  }
}

export async function markAsRead(notificationId: string) {
  try {
    await updateDoc(doc(getFirestore(), 'notifications', notificationId), { isRead: true, updatedAt: serverTimestamp() });
  } catch (error) {
    logger.error('Mark as read error:', error);
  }
}

export async function markAllAsRead(userId: string) {
  try {
    const db = getFirestore();
    const snapshot = await getDocs(query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false)));
    const batch = writeBatch(db);
    snapshot.docs.forEach(item => batch.update(item.ref, { isRead: true, updatedAt: serverTimestamp() }));
    await batch.commit();
  } catch (error) {
    logger.error('Mark all as read error:', error);
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    await deleteDoc(doc(getFirestore(), 'notifications', notificationId));
  } catch (error) {
    logger.error('Delete notification error:', error);
  }
}

export async function loadNotificationSettings(userId: string) {
  try {
    const reference = doc(getFirestore(), 'notificationSettings', userId);
    const snapshot = await getDoc(reference);
    if (snapshot.exists()) {
      store.dispatch(patchNotification({ settings: snapshot.data() as NotificationSettings }));
      return;
    }
    const settings: NotificationSettings = {
      userId,
      followNotifications: true,
      likeNotifications: true,
      commentNotifications: true,
      mentionNotifications: true,
      storyNotifications: true,
      emailNotifications: false,
      pushNotifications: true,
      updatedAt: serverTimestamp(),
    };
    await setDoc(reference, settings);
    store.dispatch(patchNotification({ settings }));
  } catch (error) {
    logger.error('Load notification settings error:', error);
  }
}

export async function updateNotificationSettings(userId: string, updates: Partial<NotificationSettings>) {
  const previous = store.getState().notification.settings;
  if (previous) store.dispatch(patchNotification({ settings: { ...previous, ...updates } }));
  try {
    await updateDoc(doc(getFirestore(), 'notificationSettings', userId), { ...updates, updatedAt: serverTimestamp() });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    if (previous) store.dispatch(patchNotification({ settings: previous }));
  }
}
