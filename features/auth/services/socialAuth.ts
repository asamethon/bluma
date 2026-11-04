import { signInWithGoogle as signInWithGoogleSDK } from '@/config/googleSignIn';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import {
  AppleAuthProvider,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { authError, AuthResult } from './authErrors';
import { establishSession } from './providerSession';

type AppleCredential = {
  identityToken: string | null;
  nonce?: string;
  user?: string;
  email?: string | null;
  fullName?: { givenName?: string | null; familyName?: string | null } | null;
};

async function signInWithGoogle(): Promise<AuthResult> {
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    const result = await signInWithGoogleSDK();
    if (!result.success) return { success: false, error: result.error };

    const googleUser = result.userInfo.data.user;
    const credential = GoogleAuthProvider.credential(result.idToken);
    const { user: firebaseUser } = await signInWithCredential(getAuth(), credential);

    await establishSession(firebaseUser, {
      email: googleUser.email,
      displayName: googleUser.name || i18n.t('common.user'),
      authProvider: 'google',
    });
    return { success: true };
  } catch (error: any) {
    logger.error('Google Sign-In error:', error);
    return authError(error.code, 'authErrors.googleSignInFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function signInWithApple(credential: AppleCredential): Promise<AuthResult> {
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    const appleCredential = AppleAuthProvider.credential(credential.identityToken, credential.nonce);
    const { user: firebaseUser } = await signInWithCredential(getAuth(), appleCredential);
    // Apple adı yalnızca ilk girişte verir; varsa tamamını al ki kayıtta bir daha sorulmasın.
    const appleName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean).join(' ').trim();

    await establishSession(firebaseUser, {
      email: firebaseUser.email || credential.email || '',
      displayName:
        firebaseUser.displayName || appleName || i18n.t('common.appleUser'),
      authProvider: 'apple',
      appleUserId: credential.user,
    });
    return { success: true };
  } catch (error: any) {
    logger.error('Apple sign in error:', error);
    return authError(error.code, 'authErrors.appleSignInFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

export const socialAuthActions = {
  signInWithGoogle,
  signInWithApple,
};
