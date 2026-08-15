import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { privacyActions } from '../services/privacyService';

/**
 * Karşı taraf "herkes mesaj gönderebilsin"i kapattıysa, yalnızca onun takip
 * ettiği kişiler yazabilir. `checking` bitene kadar karar verilmez.
 */
export function useCanMessage(targetUserId?: string) {
  const myId = useAppSelector(s => s.auth.user?.id);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!targetUserId || !myId) {
      setAllowed(null);
      return;
    }
    let alive = true;
    privacyActions
      .canSendMessageTo(targetUserId)
      .then(v => alive && setAllowed(v))
      .catch(() => alive && setAllowed(true));
    return () => {
      alive = false;
    };
  }, [targetUserId, myId]);

  return { allowed: allowed !== false, blocked: allowed === false, checking: allowed === null };
}
