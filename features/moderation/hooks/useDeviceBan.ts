import { useEffect, useState } from 'react';
import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { logger } from '@/utils/logger';
import { DeviceBan, getDeviceBan, registerDevice } from '../services/deviceBan';

/**
 * Cihaz banını açılışta bir kez sorar ve oturumlu hesabı cihaza bağlar.
 * Banlı cihazda oturum kapatılır — kural yazmayı zaten reddeder, ama
 * kullanıcı sebebini görmeden "her şey hata veriyor" sanmasın diye.
 */
export function useDeviceBan() {
  const userId = useAppSelector(s => s.auth.user?.id);
  const [ban, setBan] = useState<DeviceBan | null>(null);
  const [checking, setChecking] = useState(true);

  // Dış sisteme (Firestore) tek seferlik sorgu — effect'in meşru kullanımı.
  useEffect(() => {
    let cancelled = false;
    getDeviceBan()
      .then(result => {
        if (cancelled) return;
        setBan(result);
        if (result) {
          authActions.signOut().catch((e: unknown) => logger.error('Ban sign-out error:', e));
        }
      })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (userId && !ban) registerDevice(userId);
  }, [userId, ban]);

  return { ban, checking };
}
