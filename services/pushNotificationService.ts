import { doc, getDoc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirim handler'ını ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class PushNotificationService {
  private expoPushToken: string | null = null;

  // Expo Push Token al
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Simulator\'da push notification çalışmaz');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification izni reddedildi');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '48225aed-f559-49db-af13-d65c9d2518f0', // Expo project ID
      });
      
      this.expoPushToken = token.data;
      console.log('Expo Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Expo Push Token alınırken hata:', error);
      return null;
    }
  }

  // Kullanıcının push token'ını Firestore'a kaydet
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

      console.log('Push token kaydedildi:', userId);
      return true;
    } catch (error) {
      console.error('Push token kaydedilirken hata:', error);
      return false;
    }
  }

  // Kullanıcının push token'ını Firestore'dan al
  async getUserPushToken(userId: string): Promise<string | null> {
    try {
      const db = getFirestore();
      const tokenDoc = await getDoc(doc(db, 'userPushTokens', userId));
      
      if (tokenDoc.exists()) {
        return tokenDoc.data()?.expoPushToken || null;
      }
      
      return null;
    } catch (error) {
      console.error('Push token alınırken hata:', error);
      return null;
    }
  }

  // Push notification gönder
  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      console.log('Sending push notification:', {
        to: expoPushToken.substring(0, 20) + '...',
        title,
        body,
        data
      });

      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      console.log('Push notification message:', JSON.stringify(message, null, 2));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      console.log('Push notification response status:', response.status);
      const result = await response.json();
      console.log('Push notification response:', JSON.stringify(result, null, 2));
      
      if (result.data?.status === 'ok') {
        console.log('Push notification gönderildi:', title);
        return true;
      } else {
        console.error('Push notification gönderilemedi:', result);
        return false;
      }
    } catch (error) {
      console.error('Push notification gönderilirken hata:', error);
      return false;
    }
  }

  // Kullanıcıya push notification gönder
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      console.log('[PushNotification] Getting push token for user:', userId);
      const token = await this.getUserPushToken(userId);
      if (!token) {
        console.warn('[PushNotification] Kullanıcının push token\'ı bulunamadı. UserId:', userId);
        console.log('[PushNotification] Kullanıcının push token kayıt durumunu kontrol etmek için userPushTokens koleksiyonunu kontrol edin.');
        return false;
      }

      console.log('[PushNotification] Found push token for user:', userId);
      console.log('[PushNotification] Token preview:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
      console.log('[PushNotification] Notification details:', { title, body, dataType: data?.type });
      
      const result = await this.sendPushNotification(token, title, body, data);
      console.log('[PushNotification] Send result for user:', userId, 'Success:', result);
      
      if (!result) {
        console.error('[PushNotification] Push notification gönderilemedi. Response detayları yukarıda görülebilir.');
      }
      
      return result;
    } catch (error) {
      console.error('[PushNotification] Kullanıcıya notification gönderilirken hata:', error);
      console.error('[PushNotification] Error details:', JSON.stringify(error, null, 2));
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService(); 