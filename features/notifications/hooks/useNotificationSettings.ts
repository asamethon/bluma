import { pushNotificationService } from '@/services/pushNotificationService';
import { useAppSelector } from '@/store/hooks';
import { notificationActions } from '@/store/notificationStore';
import { useEffect } from 'react';
import { DEFAULT_SETTINGS, type ToggleKey } from '../components/settings/notificationRows';

export function useNotificationSettings() {
  const userId = useAppSelector(state => state.auth.user?.id);
  const stored = useAppSelector(state => state.notification.settings);

  useEffect(() => {
    if (userId) notificationActions.loadNotificationSettings(userId);
  }, [userId]);

  const settings = { ...DEFAULT_SETTINGS, ...stored };

  const toggle = (key: ToggleKey, value: boolean) => {
    if (!userId) return;
    notificationActions.updateNotificationSettings(userId, { [key]: value });
    // Push yeni açıldıysa cihaz jetonu hemen tazelenmeli.
    if (key === 'pushNotifications' && value) {
      pushNotificationService.saveUserPushToken(userId).catch(() => {});
    }
  };

  return { settings, toggle, pushOff: !settings.pushNotifications };
}
