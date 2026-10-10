import * as Notifications from 'expo-notifications';
import { logger } from '@/utils/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      logger.debug('Bildirim alındı:', notification);
      onNotificationReceived?.(notification);
    }
  );

  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      logger.debug('Bildirime tıklandı:', response);
      onNotificationResponse?.(response);
    }
  );

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
} 
