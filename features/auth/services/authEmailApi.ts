import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { API_SERVER_URL } from '@/constants/config';
import i18n from '@/i18n';
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
      // Şablon dili sunucuda seçiliyor: Türkçe ya da İngilizce.
      body: JSON.stringify({ kind, locale: i18n.language, ...(newEmail ? { newEmail } : {}) }),
    });
    if (res.ok) return true;
    // Yedeğe düşüş sessiz olmamalı: Firebase'in sade postası gitse bile
    // sunucunun neden reddettiğini bilmezsek sorunu hiç göremeyiz.
    const detail = await res.text().catch(() => '');
    logger.error(`Auth email server declined (${res.status}), falling back:`, detail.slice(0, 200));
    return false;
  } catch (error) {
    logger.error('Auth email server unreachable, falling back:', error);
    return false;
  }
}

/**
 * Şifre sıfırlama — kullanıcı giriş YAPMAMIŞ olduğu için token yok; sunucu
 * bu uç noktada kimlik doğrulamıyor, bunun yerine oran sınırı uyguluyor ve
 * hesabın var olup olmadığını sızdırmıyor.
 */
export async function sendPasswordResetViaServer(email: string): Promise<boolean> {
  if (!API_SERVER_URL) return false;
  try {
    const res = await fetch(`${API_SERVER_URL}/send-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale: i18n.language }),
    });
    if (res.ok) return true;
    logger.error(`Password reset server declined (${res.status}), falling back`);
    return false;
  } catch (error) {
    logger.error('Password reset server unreachable, falling back:', error);
    return false;
  }
}
