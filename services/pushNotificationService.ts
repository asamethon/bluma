import { doc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirim handler'ını ayarla. NOT: bu handler yalnızca uygulama
// foreground'dayken çalışır — arkaplan bildirimlerini OS gösterir, buraya
// hiç düşmez. Yani burada bastırdığımız şey sadece "uygulama açıkken"
// gösterilecek banner/ses.
// Kural: DM bildirimlerinde (push worker `data.type === 'message'` gönderiyor)
// uygulama açıkken banner/ses gösterme — mesaj zaten Firestore listener'ıyla
// sohbet ekranında ve mesaj kutusu rozetinde anında görünüyor, banner sadece
// spam gibi hissettiriyordu. Diğer tipler (yorum, takip, mention vb.) normal
// akışında.
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

// Push GÖNDERİMİ artık VPS'teki push-worker'ın işi (Admin SDK ile, güvenlik
// kurallarına tabi değil — bkz. YAPILACAKLAR 0.3/3.1, server/push-worker/).
// Bu servis yalnızca cihazın KENDİ token'ını alıp kaydeder; başka bir
// kullanıcının token'ını okumaz/push göndermez.
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
      return token.data;
    } catch (error) {
      console.error('Expo Push Token alınırken hata:', error);
      return null;
    }
  }

  // Kullanıcının push token'ını Firestore'a kaydet (yalnızca kendi dokümanı).
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
      console.error('Push token kaydedilirken hata:', error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
