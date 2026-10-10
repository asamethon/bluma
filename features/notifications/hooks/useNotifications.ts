import { useFollowRequests } from '@/features/social/hooks/useFollowRequests';
import { useAppSelector } from '@/store/hooks';
import { notificationActions } from '@/store/notificationStore';
import type { Notification } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';

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
    const data = item.data;
    if (item.type === 'follow_request') return router.push('/profile/follow-requests');
    if (item.type === 'follow' || item.type === 'follow_accepted') {
      if (data?.followerId) router.push(`/user/${data.followerId}` as never);
      return;
    }
    if (item.type === 'like' || item.type === 'comment' || item.type === 'mention' || item.type === 'conversation_announcement') {
      if (data?.conversationId) router.push(`/conversation/${data.conversationId}` as never);
      else if (data?.storyId) router.push(`/story/${data.storyId}` as never);
      return;
    }
    if (item.type === 'story_published' && data?.storyId) {
      router.push(`/story/${data.storyId}/preview` as never);
      return;
    }
    if (item.type === 'announcement') {
      if (data?.url) void Linking.openURL(data.url);
      else if (data?.route) router.push(data.route as never);
      return;
    }
    if (item.type === 'verify_email') return router.push('/profile/verify-email');
    if (item.type === 'new_chapter' && data?.storyId) {
      const chapter = data.chapterNumber ? Number(data.chapterNumber) - 1 : 0;
      router.push(`/story/${data.storyId}?chapter=${chapter}` as never);
    }
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
