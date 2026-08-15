import * as Device from 'expo-device';
import i18n from '@/i18n';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import { logger } from '@/utils/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissionsOnStart() {
  try {
    if (!Device.isDevice) {
      logger.debug('Simulator\'da bildirimler desteklenmiyor');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    logger.debug('Mevcut bildirim izni durumu:', existingStatus);
    
    if (existingStatus === 'granted') {
      logger.debug('Bildirim izni zaten verilmiş');
      return true;
    }

    if (existingStatus === 'denied') {
      Alert.alert(
        i18n.t('pushPermission.title'),
        i18n.t('pushPermission.message'),
        [
          { text: i18n.t('pushPermission.notNow'), style: 'cancel' },
          { 
            text: i18n.t('avatarPicker.goToSettings'), 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }
          }
        ]
      );
      return false;
    }

    logger.debug('Bildirim izni isteniyor...');
    const { status } = await Notifications.requestPermissionsAsync();
    logger.debug('Bildirim izni sonucu:', status);
    
    if (status === 'granted') {
      logger.debug('Bildirim izni verildi');
      return true;
    } else {
      logger.debug('Bildirim izni reddedildi');
      return false;
    }
  } catch (error) {
    logger.error('Bildirim izni istenirken hata:', error);
    return false;
  }
}

export async function showLocalNotification(
  title: string, 
  body: string, 
  data?: any
) {
  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      logger.debug('Bildirim izni yok, bildirim gösterilemiyor');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null,
    });
    
    logger.debug('Bildirim gönderildi:', title);
  } catch (error) {
    logger.error('Bildirim gösterilirken hata:', error);
  }
}

export async function checkNotificationPermissions() {
  try {
    if (!Device.isDevice) {
      logger.debug('Simulator\'da bildirimler desteklenmiyor');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    logger.debug('Mevcut bildirim izni durumu:', existingStatus);
    
    if (existingStatus === 'granted') {
      logger.debug('Bildirim izni zaten verilmiş');
      return true;
    }

    if (existingStatus === 'denied') {
      logger.debug('Bildirim izni reddedilmiş');
      return false;
    }

    logger.debug('Bildirim izni isteniyor...');
    const { status } = await Notifications.requestPermissionsAsync();
    logger.debug('Bildirim izni sonucu:', status);
    
    if (status === 'granted') {
      logger.debug('Bildirim izni verildi');
      return true;
    } else {
      logger.debug('Bildirim izni reddedildi');
      return false;
    }
  } catch (error) {
    logger.error('Bildirim izni kontrol edilirken hata:', error);
    return false;
  }
}

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