import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
  type SignInSuccessResponse,
} from '@react-native-google-signin/google-signin';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';

type GoogleSignInResult =
  | { success: true; idToken: string; userInfo: SignInSuccessResponse }
  | { success: false; error: string };

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '626165614889-crsvdlrp4oommq6eiu14ltn372l10al7.apps.googleusercontent.com',
    iosClientId: '626165614889-8logf9c1pufo9h0llo9jvp4cfvq98asl.apps.googleusercontent.com',
    offlineAccess: false,
    hostedDomain: '',
    forceCodeForRefreshToken: false,
  });
};

export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();

    if (isCancelledResponse(userInfo)) {
      return { success: false, error: i18n.t('authErrors.signInCancelled') };
    }

    const idToken = userInfo.data.idToken;
    if (!idToken) {
      logger.error('Google Sign-In did not return an ID token');
      return { success: false, error: i18n.t('authErrors.googleSignInFailed') };
    }

    logger.debug('Google Sign-In successful:', userInfo);
    return { success: true, idToken, userInfo };
  } catch (error: unknown) {
    logger.error('Google Sign-In error:', error);

    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, error: i18n.t('authErrors.signInCancelled') };
    }

    if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, error: i18n.t('authErrors.playServicesUnavailable') };
    }

    return { success: false, error: i18n.t('authErrors.googleSignInFailed') };
  }
};

export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    return { success: true };
  } catch (error) {
    logger.error('Google Sign-Out error:', error);
    return { success: false, error: i18n.t('authErrors.googleSignOutFailed') };
  }
};

export const getCurrentUser = async () => {
  try {
    return await GoogleSignin.getCurrentUser();
  } catch (error) {
    logger.error('Get current user error:', error);
    return null;
  }
};
