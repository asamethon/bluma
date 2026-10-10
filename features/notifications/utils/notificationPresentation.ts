import i18n from '@/i18n';
import type { Notification } from '@/types';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type Meta = { icon: ComponentProps<typeof Ionicons>['name']; color: string };
const DEFAULT_META: Meta = { icon: 'notifications', color: '#7057D9' };
const META: Partial<Record<Notification['type'], Meta>> = {
  follow: { icon: 'person-add', color: '#7057D9' },
  follow_request: { icon: 'person-add', color: '#7057D9' },
  follow_accepted: { icon: 'checkmark-circle', color: '#4CAF50' },
  like: { icon: 'heart', color: '#DE5B88' },
  comment: { icon: 'chatbubble-ellipses', color: '#2196F3' },
  mention: { icon: 'at', color: '#E6B95C' },
  welcome: { icon: 'sparkles', color: '#E6B95C' },
  story_published: { icon: 'book', color: '#4CAF50' },
  new_chapter: { icon: 'library', color: '#4CAF50' },
  conversation_announcement: { icon: 'chatbubble-ellipses', color: '#2196F3' },
  announcement: { icon: 'megaphone', color: '#7057D9' },
  verify_email: { icon: 'mail', color: '#E6B95C' },
};

export const notificationMeta = (type: Notification['type']) => META[type] || DEFAULT_META;

export function notificationTimeAgo(timestamp: unknown): string {
  if (!timestamp) return '';
  const value = timestamp as { toDate?: () => Date };
  const then = value.toDate ? value.toDate() : new Date(timestamp as string | number);
  const minutes = Math.floor((Date.now() - then.getTime()) / 60000);
  if (minutes < 1) return i18n.t('time.now');
  if (minutes < 60) return i18n.t('time.minutesShort', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return i18n.t('time.hoursShort', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return i18n.t('time.daysShort', { count: days });
  return i18n.t('time.weeksShort', { count: Math.floor(days / 7) });
}
