import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

// Bildirim handler'ını ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Uygulama başında bildirim izinlerini iste
export async function requestNotificationPermissionsOnStart() {
  try {
    // Simulator'da bildirim çalışmaz
    if (!Device.isDevice) {
      console.log('Simulator\'da bildirimler desteklenmiyor');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Mevcut bildirim izni durumu:', existingStatus);
    
    if (existingStatus === 'granted') {
      console.log('Bildirim izni zaten verilmiş');
      return true;
    }

    if (existingStatus === 'denied') {
      // Kullanıcıya bildirim izninin neden gerekli olduğunu açıkla
      Alert.alert(
        'Bildirim İzni Gerekli',
        'Yeni takipçiler, beğeniler ve yorumlar hakkında bildirim almak için izin vermeniz gerekiyor. Ayarlar > Bluma > Bildirimler yolunu takip ederek izin verebilirsiniz.',
        [
          { text: 'Şimdi Değil', style: 'cancel' },
          { 
            text: 'Ayarlara Git', 
            onPress: () => {
              // iOS'ta ayarlara yönlendirme
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }
          }
        ]
      );
      return false;
    }

    // İlk kez izin isteniyor
    console.log('Bildirim izni isteniyor...');
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Bildirim izni sonucu:', status);
    
    if (status === 'granted') {
      console.log('Bildirim izni verildi');
      return true;
    } else {
      console.log('Bildirim izni reddedildi');
      return false;
    }
  } catch (error) {
    console.error('Bildirim izni istenirken hata:', error);
    return false;
  }
}

// Yerel bildirim gösterme fonksiyonu
export async function showLocalNotification(
  title: string, 
  body: string, 
  data?: any
) {
  try {
    // Önce izinleri kontrol et
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.log('Bildirim izni yok, bildirim gösterilemiyor');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Hemen göster
    });
    
    console.log('Bildirim gönderildi:', title);
  } catch (error) {
    console.error('Bildirim gösterilirken hata:', error);
  }
}

// Bildirim izinlerini kontrol et
export async function checkNotificationPermissions() {
  try {
    // Simulator'da bildirim çalışmaz
    if (!Device.isDevice) {
      console.log('Simulator\'da bildirimler desteklenmiyor');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Mevcut bildirim izni durumu:', existingStatus);
    
    if (existingStatus === 'granted') {
      console.log('Bildirim izni zaten verilmiş');
      return true;
    }

    if (existingStatus === 'denied') {
      console.log('Bildirim izni reddedilmiş');
      return false;
    }

    // İlk kez izin isteniyor
    console.log('Bildirim izni isteniyor...');
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Bildirim izni sonucu:', status);
    
    if (status === 'granted') {
      console.log('Bildirim izni verildi');
      return true;
    } else {
      console.log('Bildirim izni reddedildi');
      return false;
    }
  } catch (error) {
    console.error('Bildirim izni kontrol edilirken hata:', error);
    return false;
  }
}

// Bildirim dinleyicilerini ayarla
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Bildirim alındı:', notification);
      onNotificationReceived?.(notification);
    }
  );

  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Bildirime tıklandı:', response);
      onNotificationResponse?.(response);
    }
  );

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
} 