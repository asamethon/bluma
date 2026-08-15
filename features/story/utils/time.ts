import i18n from '@/i18n';

export function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return i18n.t('time.justNow');

  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return i18n.t('time.justNow');

  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return i18n.t('time.justNow');
  if (diffMin < 60) return i18n.t('time.minutesAgo', { count: diffMin });

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return i18n.t('time.hoursAgo', { count: diffHour });

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return i18n.t('time.daysAgo', { count: diffDay });

  return date.toLocaleDateString(i18n.language);
}
