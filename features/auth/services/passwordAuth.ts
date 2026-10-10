import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updatePassword,
} from '@react-native-firebase/auth';
import { authError, AuthResult } from './authErrors';
import { sendPasswordResetViaServer } from './authEmailApi';
import { applyAuthLanguage } from './emailVerification';

const CHANGE_PASSWORD_ERRORS: Record<string, string> = {
  'auth/wrong-password': 'authErrors.currentPasswordWrong',
  'auth/invalid-credential': 'authErrors.currentPasswordWrong',
  'auth/weak-password': 'authErrors.newPasswordWeak',
  'auth/too-many-requests': 'authErrors.tooManyRequests',
  'auth/requires-recent-login': 'authErrors.requiresRecentLogin',
  'auth/network-request-failed': 'authErrors.network',
};

async function resetPassword(email: string): Promise<AuthResult> {
  const address = email.trim().toLowerCase();
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    // Önce kendi sunucumuz (tasarlanmış şablon, kendi alan adımız);
    // ulaşılamazsa Firebase'in sade postası gitsin.
    if (!(await sendPasswordResetViaServer(address))) {
      await applyAuthLanguage();
      await sendPasswordResetEmail(getAuth(), address);
    }
    return { success: true };
  } catch (error: any) {
    logger.error('Password reset error:', error);
    return authError(error.code, 'authErrors.resetFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
  const user = store.getState().auth.user;
  const firebaseUser = getAuth().currentUser;
  if (!user || !firebaseUser) return { success: false, error: i18n.t('authErrors.noSession') };
  if (user.authProvider !== 'email') {
    return { success: false, error: i18n.t('authErrors.socialPasswordChange') };
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
    return { success: true };
  } catch (error: any) {
    logger.error('Change password error:', error);
    const key = CHANGE_PASSWORD_ERRORS[error?.code] ?? 'authErrors.changePasswordFailed';
    return { success: false, error: i18n.t(key) };
  }
}

export const passwordActions = { resetPassword, changePassword };
