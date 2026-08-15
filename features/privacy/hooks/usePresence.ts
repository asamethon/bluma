import { useEffect, useState } from 'react';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { toMillis } from '@/features/messaging/utils/time';
import { ONLINE_WINDOW_MS } from '../services/presenceService';
import { privacyOf } from '../types';

export type Presence = { online: boolean; lastActiveAt: number };

const OFFLINE: Presence = { online: false, lastActiveAt: 0 };

/**
 * Karşı tarafın çevrimiçi/son görülme durumu. Kullanıcı etkinlik durumunu
 * kapattıysa hiçbir bilgi dönmez (damga zaten yazılmaz, burada da okunmaz).
 */
export function usePresence(userId?: string): Presence {
  const [presence, setPresence] = useState<Presence>(OFFLINE);

  useEffect(() => {
    if (!userId) {
      setPresence(OFFLINE);
      return;
    }
    return onSnapshot(
      doc(getFirestore(), 'users', userId),
      snap => {
        const data = snap && snap.exists() ? (snap.data() as any) : null;
        if (!data || !privacyOf(data).showActivity) {
          setPresence(OFFLINE);
          return;
        }
        const lastActiveAt = toMillis(data.lastActiveAt);
        setPresence({
          online: lastActiveAt > 0 && Date.now() - lastActiveAt < ONLINE_WINDOW_MS,
          lastActiveAt,
        });
      },
      () => setPresence(OFFLINE)
    );
  }, [userId]);

  return presence;
}

/** "çevrimiçi" / "son görülme 5 dk önce" satırı; bilgi yoksa boş metin. */
export function formatPresence(presence: Presence): string {
  if (presence.online) return i18n.t('messages.online');
  if (!presence.lastActiveAt) return '';

  const diffMin = Math.floor((Date.now() - presence.lastActiveAt) / 60000);
  let when: string;
  if (diffMin < 1) when = i18n.t('time.justNow');
  else if (diffMin < 60) when = i18n.t('time.minutesAgo', { count: diffMin });
  else if (diffMin < 1440) when = i18n.t('time.hoursAgo', { count: Math.floor(diffMin / 60) });
  else when = i18n.t('time.daysAgo', { count: Math.floor(diffMin / 1440) });

  return i18n.t('messages.lastSeen', { when });
}
