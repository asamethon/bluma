import { deleteDoc, doc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

class PushNotificationService {
  private registrationVersion = 0;

  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        logger.debug('Simulator\'da push notification çalışmaz');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      const { status } = existingStatus === 'granted'
        ? { status: existingStatus }
        : await Notifications.requestPermissionsAsync();

      if (status !== 'granted') {
        logger.debug('Push notification izni reddedildi');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '48225aed-f559-49db-af13-d65c9d2518f0',
      });

      return token.data;
    } catch (error) {
      logger.error('Expo Push Token alınırken hata:', error);
      return null;
    }
  }

  async saveUserPushToken(userId: string): Promise<boolean> {
    const version = this.registrationVersion;
    try {
      const token = await this.getExpoPushToken();
      if (!token) return false;
      // Çıkış sırasında başlamış eski kayıt yeni oturumun token'ını ele geçirmesin.
      if (version !== this.registrationVersion || getAuth().currentUser?.uid !== userId) return false;

      const db = getFirestore();
      const tokenRef = doc(db, 'userPushTokens', userId);
      await setDoc(tokenRef, {
        userId,
        expoPushToken: token,
        platform: Platform.OS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Yazma çıkışla yarıştıysa eski hesabın kaydını sonradan temizle.
      if (version !== this.registrationVersion && getAuth().currentUser?.uid !== userId) {
        await deleteDoc(tokenRef);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Push token kaydedilirken hata:', error);
      return false;
    }
  }

  async removeUserPushToken(userId: string): Promise<void> {
    this.registrationVersion += 1;
    try {
      await deleteDoc(doc(getFirestore(), 'userPushTokens', userId));
    } catch (error) {
      logger.debug('Push token silinirken hata (non-critical):', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
