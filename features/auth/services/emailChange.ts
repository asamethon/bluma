import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from '@react-native-firebase/auth';
import { doc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { patchAuth } from '@/store/slices/authSlice';
import { store } from '@/store';
import { logger } from '@/utils/logger';
import { isDisposableEmail } from './disposableEmails';
import { applyAuthLanguage } from './emailVerification';

/**
 * Doğrulanmamış adresi düzeltme — kayıtta e-postasını yanlış yazan kullanıcı
 * doğrulama postasını hiç alamıyor ve hesabı kilitli kalıyordu.
 *
 * `verifyBeforeUpdateEmail` kullanılır (`updateEmail` değil): bağlantı YENİ
 * adrese gider ve adres ancak tıklandıktan sonra değişir. Yani kimse sahibi
 * olmadığı bir adrese geçemez.
 */
export type EmailChangeResult = {
  success: boolean;
  error?: string;
  needsPassword?: boolean;
};

export async function changeUnverifiedEmail(
  newEmail: string,
  password?: string
): Promise<EmailChangeResult> {
  const user = getAuth().currentUser;
  if (!user) return { success: false, error: i18n.t('errors.loginRequired') };

  const email = newEmail.trim().toLowerCase();
  if (!/\S+@\S+\.\S+/.test(email)) {
    return { success: false, error: i18n.t('auth.enterValidEmail') };
  }
  if (isDisposableEmail(email)) {
    return { success: false, error: i18n.t('authErrors.disposableEmail') };
  }
  if (email === user.email?.toLowerCase()) {
    return { success: false, error: i18n.t('emailVerify.sameAddress') };
  }

  try {
    await applyAuthLanguage();
    await verifyBeforeUpdateEmail(user, email);
    return { success: true };
  } catch (error: any) {
    if (error?.code === 'auth/email-already-in-use') {
      return { success: false, error: i18n.t('authErrors.emailInUse') };
    }
    // Uzun süredir açık oturumda Firebase yeniden kimlik doğrulama ister.
    if (error?.code !== 'auth/requires-recent-login') {
      logger.error('Email change error:', error);
      return { success: false, error: i18n.t('emailVerify.changeFailed') };
    }
    if (!password) {
      return { success: false, error: i18n.t('emailVerify.needsPassword'), needsPassword: true };
    }
    try {
      const credential = EmailAuthProvider.credential(user.email || '', password);
      await reauthenticateWithCredential(user, credential);
      await verifyBeforeUpdateEmail(user, email);
      return { success: true };
    } catch (reauthError: any) {
      logger.error('Email change reauth error:', reauthError);
      const wrongPassword = reauthError?.code === 'auth/wrong-password';
      return {
        success: false,
        error: i18n.t(wrongPassword ? 'authErrors.wrongPassword' : 'account.reauthFailed'),
        needsPassword: true,
      };
    }
  }
}

/**
 * Adres değişimi/doğrulaması uygulama DIŞINDA tamamlanır (postadaki bağlantı).
 * Dönüşte Auth'taki güncel adresi Firestore'a ve store'a yansıtır.
 */
export async function syncEmailFromAuth() {
  const user = getAuth().currentUser;
  const stateUser = store.getState().auth.user;
  if (!user?.email || !stateUser || stateUser.email === user.email) return;

  try {
    await setDoc(doc(getFirestore(), 'users', user.uid), { email: user.email }, { merge: true });
    store.dispatch(patchAuth({ user: { ...stateUser, email: user.email } }));
  } catch (error) {
    logger.error('Email sync error:', error);
  }
}

export const emailChangeActions = { changeUnverifiedEmail, syncEmailFromAuth };
