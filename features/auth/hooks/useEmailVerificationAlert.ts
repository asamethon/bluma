import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { logger } from '@/utils/logger';
import { GRACE_DAYS, ensureGraceStarted } from '../services/emailGrace';
import {
  needsEmailVerification,
  refreshVerificationState,
} from '../services/emailVerification';

/**
 * Doğrulama uyarısının takvimi.
 *
 * Her açılışta uyarmak 7 gün boyunca dırdır olur ve kullanıcıyı uygulamayı
 * silmeye iter. Bunun yerine iki kez gösteriyoruz — ilk görüşte ve 2 gün
 * sonra — süre dolmadan hemen önceki hatırlatma ise sunucudan bildirim
 * olarak gidiyor (notify-unverified.js --grace-day).
 */
const SHOW_AT_DAYS = [0, 2];
const STORAGE_KEY = 'bluma.emailAlertShownCount';

/** Kaçıncı gösterimdeyiz ve şimdi göstermeli miyiz? */
function shouldShow(shownCount: number, daysSinceStart: number) {
  return shownCount < SHOW_AT_DAYS.length && daysSinceStart >= SHOW_AT_DAYS[shownCount];
}

export function useEmailVerificationAlert() {
  const userId = useAppSelector(s => s.auth.user?.id);
  const handled = useRef(false);

  useEffect(() => {
    if (!userId || handled.current || !needsEmailVerification()) return;
    handled.current = true;

    const lifecycle = { cancelled: false };
    // Açılış animasyonuyla çakışmasın.
    const timer = setTimeout(async () => {
      // Başka bir cihazda doğrulamış olabilir; boş yere uyarma.
      if (await refreshVerificationState()) return;
      if (lifecycle.cancelled) return;

      const grace = await ensureGraceStarted();
      if (!grace || lifecycle.cancelled) return;

      const shownCount = Number(await AsyncStorage.getItem(STORAGE_KEY).catch(() => null)) || 0;
      const daysSinceStart = Math.floor((Date.now() - grace.startedAt.getTime()) / 86400_000);
      if (!shouldShow(shownCount, daysSinceStart)) return;

      await AsyncStorage.setItem(STORAGE_KEY, String(shownCount + 1))
        .catch(e => logger.error('Email alert counter error:', e));

      Alert.alert(
        i18n.t('emailVerify.alertTitle'),
        i18n.t('emailVerify.alertBody', { days: grace.daysLeft ?? GRACE_DAYS }),
        [
          { text: i18n.t('emailVerify.alertLater'), style: 'cancel' },
          {
            text: i18n.t('emailVerify.alertGo'),
            onPress: () => router.push('/profile/verify-email' as any),
          },
        ]
      );
    }, 1500);

    return () => { lifecycle.cancelled = true; clearTimeout(timer); };
  }, [userId]);
}
