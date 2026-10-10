import type { NotificationSettings } from '@/types';
import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type ToggleKey = keyof Omit<NotificationSettings, 'userId' | 'updatedAt'>;

export const DEFAULT_SETTINGS: Record<ToggleKey, boolean> = {
  pushNotifications: true,
  emailNotifications: false,
  storyNotifications: true,
  likeNotifications: true,
  commentNotifications: true,
  followNotifications: true,
  mentionNotifications: true,
};

export type SettingRow = {
  key: ToggleKey;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  caption: string;
};

export const CHANNEL_ROWS: SettingRow[] = [
  { key: 'pushNotifications', icon: 'notifications-outline', title: 'notifSettings.push', caption: 'notifSettings.pushSub' },
  { key: 'emailNotifications', icon: 'mail-outline', title: 'notifSettings.email', caption: 'notifSettings.emailSub' },
];

export const ACTIVITY_ROWS: SettingRow[] = [
  { key: 'storyNotifications', icon: 'book-outline', title: 'notifSettings.newChapter', caption: 'notifSettings.newChapterSub' },
  { key: 'likeNotifications', icon: 'heart-outline', title: 'notifSettings.likes', caption: 'notifSettings.likesSub' },
  { key: 'commentNotifications', icon: 'chatbubble-ellipses-outline', title: 'notifSettings.comments', caption: 'notifSettings.commentsSub' },
  { key: 'followNotifications', icon: 'person-add-outline', title: 'notifSettings.newFollower', caption: 'notifSettings.newFollowerSub' },
];
