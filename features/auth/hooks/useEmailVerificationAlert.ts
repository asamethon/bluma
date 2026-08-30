import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { GRACE_DAYS, ensureGraceStarted } from '../services/emailGrace';
import {
  needsEmailVerification,
  refreshVerificationState,
} from '../services/emailVerification';

/**
 * Açılışta bir kez: e-postası doğrulanmamış kullanıcıyı uyarır ve 7 günlük
 * sayacı BURADA başlatır — kayıt tarihinde değil. Uygulamayı aylardır
 * açmamış birinin süresi, haberi olmadan dolmuş olmasın diye.
 */
export function useEmailVerificationAlert() {
  const userId = useAppSelector(s => s.auth.user?.id);
  const shown = useRef(false);

  useEffect(() => {
    if (!userId || shown.current || !needsEmailVerification()) return;
    shown.current = true;

    let cancelled = false;
    // Açılış animasyonuyla çakışmasın.
    const timer = setTimeout(async () => {
      // Başka bir cihazda doğrulamış olabilir; boş yere uyarma.
      if (await refreshVerificationState()) return;
      if (cancelled) return;

      const grace = await ensureGraceStarted();
      Alert.alert(
        i18n.t('emailVerify.alertTitle'),
        i18n.t('emailVerify.alertBody', { days: grace?.daysLeft ?? GRACE_DAYS }),
        [
          { text: i18n.t('emailVerify.alertLater'), style: 'cancel' },
          {
            text: i18n.t('emailVerify.alertGo'),
            onPress: () => router.push('/profile/verify-email' as any),
          },
        ]
      );
    }, 1500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [userId]);
}
