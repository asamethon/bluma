import i18n from '@/i18n';
import type { User } from '@/store/slices/authSlice';
import {
  AppleAuthProvider,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

export async function reauthenticateForDeletion(user: User, firebaseUser: any, password?: string) {
  if (user.authProvider === 'email') {
    if (!password) return;
    return reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(user.email, password));
  }
  if (user.authProvider === 'google') {
    const session: any = await GoogleSignin.signInSilently();
    const idToken = session?.data?.idToken;
    if (!idToken) throw Object.assign(new Error(i18n.t('authErrors.googleSessionMissing')), { code: 'auth/requires-recent-login' });
    return reauthenticateWithCredential(firebaseUser, GoogleAuthProvider.credential(idToken));
  }
  if (!user.appleUserId) {
    throw Object.assign(new Error(i18n.t('authErrors.appleUserIdMissing')), { code: 'auth/requires-recent-login' });
  }
  const refreshed = await AppleAuthentication.refreshAsync({ user: user.appleUserId });
  if (!refreshed.identityToken) {
    throw Object.assign(new Error(i18n.t('authErrors.appleRefreshFailed')), { code: 'auth/requires-recent-login' });
  }
  return reauthenticateWithCredential(firebaseUser, AppleAuthProvider.credential(refreshed.identityToken));
}

export function reauthenticationMessage(error: any) {
  if (error?.code === 'auth/wrong-password') return i18n.t('authErrors.wrongPassword');
  if (error?.code === 'auth/user-mismatch') return i18n.t('account.userMismatch');
  if (error?.code === 'auth/requires-recent-login') return i18n.t('account.deleteRequiresRelogin');
  return i18n.t('account.reauthFailed');
}
