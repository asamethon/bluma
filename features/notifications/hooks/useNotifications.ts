import { useFollowRequests } from '@/features/social/hooks/useFollowRequests';
import { useAppSelector } from '@/store/hooks';
import { notificationActions } from '@/store/notificationStore';
import type { Notification } from '@/types';
import { notificationTarget } from '../utils/notificationTarget';
import { localizeNotification } from '../utils/localizeNotification';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Alert, Linking } from 'react-native';

export function useNotifications() {
  const router = useRouter();
  const currentUser = useAppSelector(state => state.auth.user);
  const isGuest = useAppSelector(state => state.auth.isGuest);
  const notifications = useAppSelector(state => state.notification.notifications);
  const isLoading = useAppSelector(state => state.notification.isLoading);
  const unreadCount = useAppSelector(state => state.notification.unreadCount);
  const { requests } = useFollowRequests();
  const userId = currentUser?.id;

  useEffect(() => {
    if (userId) void notificationActions.initializeNotifications(userId);
  }, [userId]);

  const open = useCallback((item: Notification) => {
    void notificationActions.markAsRead(item.id);
    const target = notificationTarget(item);
    if (item.type === 'announcement' && target?.kind === 'route' && target.value === '/notifications') {
      const copy = localizeNotification(item);
      Alert.alert(copy.title, copy.message);
      return;
    }
    if (target?.kind === 'url') void Linking.openURL(target.value).catch(() => {});
    else if (target) router.push(target.value as never);
  }, [router]);

  return {
    currentUser,
    isGuest,
    isLoading,
    notifications,
    open,
    requests,
    unreadCount,
    delete: notificationActions.deleteNotification,
    markAll: () => userId && void notificationActions.markAllAsRead(userId),
    refresh: () => userId && void notificationActions.initializeNotifications(userId),
  };
}
