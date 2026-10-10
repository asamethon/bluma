import { notificationActions } from '@/store/notificationStore';
import type { Notification } from '@/types';
import { notificationTarget } from '@/features/notifications/utils/notificationTarget';
import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';

/**
 * Soğuk açılış ve arka plandan dönüşte aynı son yanıtı izler. Geçiş, kök
 * gezgin ile açılış perdesi hazır olduğunda yapılır.
 */
export function useNotificationRouting(appReady: boolean) {
  const response = Notifications.useLastNotificationResponse();
  const navigation = useRootNavigationState();

  useEffect(() => {
    if (!appReady || !navigation?.key || !response
      || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = response.notification.request.content.data ?? {};
    const target = notificationTarget({
      type: typeof data.type === 'string' ? data.type : undefined,
      senderId: typeof data.senderId === 'string' ? data.senderId : undefined,
      data: data as Notification['data'],
    });
    if (target?.kind === 'route') router.push(target.value as never);
    else if (target?.kind === 'url') void Linking.openURL(target.value).catch(() => {});
    if (typeof data.notificationId === 'string') {
      void notificationActions.markAsRead(data.notificationId);
    }
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [appReady, navigation?.key, response]);
}
