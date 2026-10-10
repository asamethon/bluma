import { setupNotificationListeners } from '@/utils/notification';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';

/**
 * Push bildirimine tıklanınca ilgili ekrana gider. Dinleyici hiç kurulmadığı
 * için tıklama önceden yalnızca uygulamayı açıyordu.
 */
export function useNotificationRouting() {
  useEffect(() => setupNotificationListeners(undefined, response => {
    const data = response.notification.request.content.data ?? {};
    if (typeof data.route === 'string' && data.route.startsWith('/')) {
      router.push(data.route as never);
      return;
    }
    // Duyurularda mağaza bağlantısı gelir; yalnızca http(s) açılır.
    if (typeof data.url === 'string' && /^https?:\/\//.test(data.url)) {
      Linking.openURL(data.url).catch(() => {});
    }
  }), []);
}
