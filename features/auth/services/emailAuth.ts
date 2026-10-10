import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from '@react-native-firebase/auth';
import { authError, AuthResult } from './authErrors';
import { isDisposableEmail } from './disposableEmails';
import { sendVerificationEmail } from './emailVerification';
import { passwordActions } from './passwordAuth';
import { establishSession } from './providerSession';

// Klavye/otomatik doldurma kaynaklı boşluk ve büyük harf, Firebase'de
// auth/invalid-credential hatasına yol açıyor — tek noktada temizliyoruz.
const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    const { user: firebaseUser } = await signInWithEmailAndPassword(
      getAuth(),
      normalizeEmail(email),
      password,
    );

    await establishSession(firebaseUser, {
      email: firebaseUser.email || '',
      displayName:
        firebaseUser.displayName || firebaseUser.email?.split('@')[0] || i18n.t('common.user'),
      authProvider: 'email',
    });
    return { success: true };
  } catch (error: any) {
    logger.error('Email sign in error:', error);
    return authError(error.code, 'authErrors.signInFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult> {
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    if (isDisposableEmail(email)) {
      return { success: false, error: i18n.t('authErrors.disposableEmail') };
    }

    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      getAuth(),
      normalizeEmail(email),
      password,
    );
    await updateProfile(firebaseUser, { displayName });

    await establishSession(firebaseUser, {
      email: firebaseUser.email || '',
      displayName,
      authProvider: 'email',
    });

    // Doğrulama postası beklenmez — hesap açılışını yavaşlatmasın; kullanıcı
    // içerik üretmeye kalkınca zaten doğrulama isteniyor (bkz. useEmailGate).
    sendVerificationEmail().catch(error => logger.error('Verification mail error:', error));
    return { success: true };
  } catch (error: any) {
    logger.error('Email sign up error:', error);
    return authError(error.code, 'authErrors.signUpFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

export const emailAuthActions = {
  signInWithEmail,
  signUpWithEmail,
  ...passwordActions,
};
