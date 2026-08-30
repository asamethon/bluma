import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { API_SERVER_URL } from '@/constants/config';
import { logger } from '@/utils/logger';

/**
 * Doğrulama/şifre postalarını KENDİ sunucumuzdan gönderir.
 *
 * Firebase'in şablon düzenlemesi bu projede kilitli ve gönderen adresi
 * paylaşımlı firebaseapp.com — Gmail spam'e atıyordu. VPS'teki uç nokta
 * bağlantıyı Admin SDK ile üretip kendi tasarımımızı kendi alan adımızdan
 * gönderiyor (bkz. server/push-worker/authEmails.js).
 *
 * Sunucu yapılandırılmamışsa (503) ya da erişilemezse `false` döner; çağıran
 * Firebase'in kendi gönderimine düşer — posta hiç gitmemesindense sade gitsin.
 */
export async function sendAuthEmailViaServer(
  kind: 'verify' | 'change' | 'reset',
  newEmail?: string
): Promise<boolean> {
  const user = getAuth().currentUser;
  if (!user || !API_SERVER_URL) return false;

  try {
    const idToken = await getIdToken(user);
    const res = await fetch(`${API_SERVER_URL}/send-auth-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ kind, ...(newEmail ? { newEmail } : {}) }),
    });
    if (res.ok) return true;
    logger.debug('Auth email server declined, falling back:', res.status);
    return false;
  } catch (error) {
    logger.debug('Auth email server unreachable, falling back:', error);
    return false;
  }
}
