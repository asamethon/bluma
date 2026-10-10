import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';

/** Her rota değişimini analytics'e `screen_view` olarak bildirir. */
export function useScreenTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    logEvent(getAnalytics(), 'screen_view', { screen_name: pathname, screen_class: pathname })
      .catch(() => {});
  }, [pathname]);
}
