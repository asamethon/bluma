import {
  createFollowAcceptedNotification,
  createFollowNotification,
  createFollowRequestNotification,
} from '@/features/notifications/services/followNotifications';
import {
  cleanupNotificationsListener,
  initializeNotifications,
} from '@/features/notifications/services/notificationListener';
import {
  createNotification,
  deleteNotification,
  loadNotificationSettings,
  markAllAsRead,
  markAsRead,
  updateNotificationSettings,
} from '@/features/notifications/services/notificationRepository';
import {
  announceStoryToFollowers,
  createCommentNotification,
  createLikeNotification,
  createMentionNotification,
  createWelcomeNotification,
} from '@/features/notifications/services/storyNotifications';

export const notificationActions = {
  announceStoryToFollowers,
  cleanupNotificationsListener,
  createCommentNotification,
  createFollowAcceptedNotification,
  createFollowNotification,
  createFollowRequestNotification,
  createLikeNotification,
  createMentionNotification,
  createNotification,
  createWelcomeNotification,
  deleteNotification,
  initializeNotifications,
  loadNotificationSettings,
  markAllAsRead,
  markAsRead,
  updateNotificationSettings,
};
