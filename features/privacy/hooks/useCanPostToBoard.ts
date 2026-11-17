import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { privacyActions } from '../services/privacyService';

/**
 * Pano sahibinin "Panoma kimler yazabilir" ayarı yazma satırını belirler.
 * `checking` bitene kadar satır basılmaz: izin yoksa hiç görünmemeli, bir
 * kare görünüp kaybolmamalı. Misafirde izin sorulmaz — satır gösterilir ve
 * dokunulduğunda GuestGate devralır.
 */
export function useCanPostToBoard(ownerId?: string) {
  const viewerId = useAppSelector(s => s.auth.user?.id);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ownerId || !viewerId) {
      setAllowed(null);
      return;
    }
    const lifecycle = { active: true };
    privacyActions
      .canPostToBoard(ownerId)
      .then(value => { if (lifecycle.active) setAllowed(value); })
      .catch(() => { if (lifecycle.active) setAllowed(false); });
    return () => {
      lifecycle.active = false;
    };
  }, [ownerId, viewerId]);

  return { allowed: allowed === true, checking: allowed === null };
}
