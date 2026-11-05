import { useAppSelector } from '@/store/hooks';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { refreshPushPermission } from '../services/pushPermission';

/**
 * İzin durumunu store'da güncel tutar. Uygulamaya her dönüşte yeniden okunur:
 * kullanıcı izni telefonun Ayarlar'ından açıp geldiyse şerit kaybolur ve
 * token o an kaydedilir. Kökte tek bir yerde (PushPromptSheet) kurulur.
 */
export function usePushPermissionWatcher() {
  const userId = useAppSelector(state => state.auth.user?.id);
  const isGuest = useAppSelector(state => state.auth.isGuest);

  useEffect(() => {
    if (!userId || isGuest) return;
    void refreshPushPermission();
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') void refreshPushPermission({ registerOnGrant: true });
    });
    return () => subscription.remove();
  }, [userId, isGuest]);
}
