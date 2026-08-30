import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { logger } from '@/utils/logger';

/**
 * Doğrulama için tanınan süre.
 *
 * Sayaç, kullanıcı uyarıyı GÖRDÜĞÜ anda başlar — kayıt tarihinden değil.
 * Uygulamayı aylardır açmamış birinin süresi haberi olmadan dolmasın diye.
 *
 * `emailGrace/{uid}` dokümanı bir kez oluşturulur ve DEĞİŞTİRİLEMEZ (kural:
 * update/delete kapalı), yoksa süre dolduğunda dokümanı silip yeniden
 * başlatmak mümkün olurdu.
 */
export const GRACE_DAYS = 7;

export type Grace = { startedAt: Date; deadline: Date; daysLeft: number };

function toGrace(startedAt: Date): Grace {
  const deadline = new Date(startedAt.getTime() + GRACE_DAYS * 86400_000);
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400_000));
  return { startedAt, deadline, daysLeft };
}

/** Süreyi başlatır (ilk uyarıda) ya da hâlihazırdakini döner. */
export async function ensureGraceStarted(): Promise<Grace | null> {
  const user = getAuth().currentUser;
  if (!user) return null;

  const ref = doc(getFirestore(), 'emailGrace', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const startedAt = snap.data()?.startedAt?.toDate?.();
      // serverTimestamp henüz yazılmadıysa (yerel önbellek) bugünü varsay.
      return toGrace(startedAt ?? new Date());
    }
    await setDoc(ref, { userId: user.uid, startedAt: serverTimestamp() });
    return toGrace(new Date());
  } catch (error) {
    logger.error('Email grace error:', error);
    return null;
  }
}

export const emailGraceActions = { ensureGraceStarted, GRACE_DAYS };
