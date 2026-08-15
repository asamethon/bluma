import { deleteDoc, doc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const type = (notification?.request?.content?.data as any)?.type;
    if (type === 'message') {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

class PushNotificationService {
  private expoPushToken: string | null = null;

  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        logger.debug('Simulator\'da push notification çalışmaz');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.debug('Push notification izni reddedildi');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '48225aed-f559-49db-af13-d65c9d2518f0',
      });

      this.expoPushToken = token.data;
      return token.data;
    } catch (error) {
      logger.error('Expo Push Token alınırken hata:', error);
      return null;
    }
  }

  async saveUserPushToken(userId: string): Promise<boolean> {
    try {
      const token = await this.getExpoPushToken();
      if (!token) return false;

      const db = getFirestore();
      await setDoc(doc(db, 'userPushTokens', userId), {
        userId,
        expoPushToken: token,
        platform: Platform.OS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      logger.error('Push token kaydedilirken hata:', error);
      return false;
    }
  }

  async removeUserPushToken(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(getFirestore(), 'userPushTokens', userId));
    } catch (error) {
      logger.debug('Push token silinirken hata (non-critical):', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
