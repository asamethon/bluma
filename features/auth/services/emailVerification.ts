import {
  getAuth,
  getIdToken,
  sendEmailVerification,
  setLanguageCode,
} from '@react-native-firebase/auth';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { syncEmailFromAuth } from './emailChange';
import { sendAuthEmailViaServer } from './authEmailApi';

/**
 * E-posta doğrulaması — sahte adresle hesap açmanın asıl kapısı.
 *
 * Güvenlik kuralları içerik üretimini `email_verified` claim'ine bağlar
 * (firestore.rules → emailVerified()). Sosyal girişler (Google/Apple) zaten
 * doğrulanmış sayılır; kural yalnızca `password` sağlayıcısını zorlar.
 */

/**
 * Firebase e-postalarını kullanıcının dilinde gönderir. Console'da her dil için
 * ayrı şablon tutuluyor; dil kodu ayarlanmazsa hep varsayılan (İngilizce)
 * şablon gider. Gönderen her fonksiyon çağırmalı.
 */
export async function applyAuthLanguage() {
  try {
    await setLanguageCode(getAuth(), i18n.language || 'tr');
  } catch (error) {
    logger.debug('Auth language set skipped:', error);
  }
}

export async function sendVerificationEmail() {
  const user = getAuth().currentUser;
  if (!user) return { success: false, error: i18n.t('errors.loginRequired') };
  if (user.emailVerified) return { success: true };

  try {
    // Önce kendi sunucumuz (tasarlanmış şablon, kendi alan adımız); o
    // çalışmazsa Firebase'in sade postası gitsin — hiç gitmemesinden iyi.
    if (await sendAuthEmailViaServer('verify')) return { success: true };

    await applyAuthLanguage();
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    logger.error('Send verification email error:', error);
    const tooMany = error?.code === 'auth/too-many-requests';
    return {
      success: false,
      error: i18n.t(tooMany ? 'authErrors.tooManyRequests' : 'emailVerify.sendFailed'),
    };
  }
}

/**
 * Kullanıcı postadaki bağlantıya tıkladıktan sonra çağrılır. Token'ı ZORLA
 * tazelemek şart: `email_verified` claim'i eski token'da hâlâ false görünür
 * ve kurallar yazmayı reddetmeye devam eder.
 */
export async function refreshVerificationState(): Promise<boolean> {
  const user = getAuth().currentUser;
  if (!user) return false;
  try {
    await user.reload();
    const fresh = getAuth().currentUser;
    if (fresh?.emailVerified) {
      await getIdToken(fresh, true);
      // Adres değiştirildiyse Auth'taki yeni adresi profile de yansıt.
      await syncEmailFromAuth();
    }
    return !!fresh?.emailVerified;
  } catch (error) {
    logger.error('Refresh verification state error:', error);
    return false;
  }
}

/** Doğrulama gerekiyor mu? Sosyal girişlerde her zaman false. */
export function needsEmailVerification(): boolean {
  const user = getAuth().currentUser;
  if (!user) return false;
  const isPassword = user.providerData.some(p => p.providerId === 'password');
  return isPassword && !user.emailVerified;
}

/**
 * İçerik üreten servislerin başında çağrılır. Doğrulanmamışsa engeller VE
 * doğrulama postasını tazeler — kullanıcı ayrı bir ekran aramak zorunda
 * kalmasın diye. Güvenlik kuralları aynı şeyi sunucu tarafında zorlar; bu
 * fonksiyon yalnızca anlaşılır bir hata mesajı üretmek içindir.
 */
export async function assertEmailVerified(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!needsEmailVerification()) return { ok: true };

  // Kullanıcı postadaki bağlantıya yeni tıklamış olabilir.
  if (await refreshVerificationState()) return { ok: true };

  const email = getAuth().currentUser?.email || '';
  const sent = await sendVerificationEmail();
  return {
    ok: false,
    error: sent.success
      ? i18n.t('emailVerify.requiredResent', { email })
      : i18n.t('emailVerify.required'),
  };
}

export const emailVerificationActions = {
  assertEmailVerified,
  sendVerificationEmail,
  refreshVerificationState,
  needsEmailVerification,
};
