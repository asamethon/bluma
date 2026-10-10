import * as Notifications from 'expo-notifications';

/** Uygulama açıkken gelen push'lar da kullanıcıya görünür. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
