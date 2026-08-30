import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  getIdToken,
  EmailAuthProvider,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { patchAuth, User } from '@/store/slices/authSlice';
import { store } from '@/store';
import i18n from '@/i18n';
import { authError, AuthResult } from './authErrors';
import { buildSignupContext, trackSignupContext } from './signupContext';
import { isDisposableEmail } from './disposableEmails';
import { applyAuthLanguage, sendVerificationEmail } from './emailVerification';
import { sendPasswordResetViaServer } from './authEmailApi';
import { logger } from '@/utils/logger';

// Klavye/otomatik doldurma kaynaklı boşluk ve büyük harf, Firebase'de
// auth/invalid-credential hatasına yol açıyor — tek noktada temizliyoruz.
const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    const authInstance = getAuth();
    const userCredential = await signInWithEmailAndPassword(authInstance, normalizeEmail(email), password);
    const firebaseUser = userCredential.user;

    const db = getFirestore();
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    let userData = userDoc.data();

    if (!userData) {
      const signupContext = buildSignupContext();
      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || i18n.t('common.user'),
        authProvider: 'email' as const,
        ...signupContext,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
      trackSignupContext(signupContext);
    }

    const token = await getIdToken(firebaseUser);

    store.dispatch(patchAuth({ token: token }));
    store.dispatch(patchAuth({ user: userData as User }));
    store.dispatch(patchAuth({ isAuthenticated: true }));
    store.dispatch(patchAuth({ isGuest: false }));

    if (userData.username && userData.interests) {
      store.dispatch(patchAuth({ hasCompletedOnboarding: true }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    } else {
      store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
    }

    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));

    try {
      const { pushNotificationService } = await import('@/services/pushNotificationService');
      await pushNotificationService.saveUserPushToken(firebaseUser.uid);
    } catch (error) {
      logger.debug('Push token kaydedilirken hata (non-critical):', error);
    }

    store.dispatch(patchAuth({ isLoading: false }));

    return { success: true };
  } catch (error: any) {
    logger.error('Email sign in error:', error);

    return authError(error.code, 'authErrors.signInFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function signUpWithEmail(email: string, password: string, displayName: string): Promise<AuthResult> {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    if (isDisposableEmail(email)) {
      return { success: false, error: i18n.t('authErrors.disposableEmail') };
    }

    const authInstance = getAuth();
    const userCredential = await createUserWithEmailAndPassword(authInstance, normalizeEmail(email), password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, {
      displayName: displayName,
    });

    const signupContext = buildSignupContext();
    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: displayName,
      authProvider: 'email' as const,
      ...signupContext,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const db = getFirestore();
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, userData);

    const token = await getIdToken(firebaseUser);

    store.dispatch(patchAuth({ token: token }));
    store.dispatch(patchAuth({ user: userData as User }));
    store.dispatch(patchAuth({ isAuthenticated: true }));
    store.dispatch(patchAuth({ isGuest: false }));
    store.dispatch(patchAuth({ hasCompletedOnboarding: false }));

    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    await AsyncStorage.setItem('hasCompletedOnboarding', 'false');

    try {
      const { pushNotificationService } = await import('@/services/pushNotificationService');
      await pushNotificationService.saveUserPushToken(firebaseUser.uid);
    } catch (error) {
      logger.debug('Push token kaydedilirken hata (non-critical):', error);
    }

    // Doğrulama postası beklenmez — hesap açılışını yavaşlatmasın; kullanıcı
    // içerik üretmeye kalkınca zaten doğrulama isteniyor (bkz. useEmailGate).
    sendVerificationEmail().catch((e) => logger.error('Verification mail error:', e));

    trackSignupContext(signupContext);
    logEvent(getAnalytics(), 'sign_up', { method: 'email' }).catch(() => {});

    store.dispatch(patchAuth({ isLoading: false }));

    return { success: true };
  } catch (error: any) {
    logger.error('Email sign up error:', error);

    return authError(error.code, 'authErrors.signUpFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function resetPassword(email: string): Promise<AuthResult> {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    // Önce kendi sunucumuz (tasarlanmış şablon, kendi alan adımız);
    // ulaşılamazsa Firebase'in sade postası gitsin.
    if (!(await sendPasswordResetViaServer(normalizeEmail(email)))) {
      await applyAuthLanguage();
      await sendPasswordResetEmail(getAuth(), normalizeEmail(email));
    }

    logger.debug('Password reset email sent successfully');
    return { success: true };
  } catch (error: any) {
    logger.error('Password reset error:', error);

    return authError(error.code, 'authErrors.resetFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
  try {
    const user = store.getState().auth.user;
    const firebaseUser = getAuth().currentUser;
    if (!user || !firebaseUser) {
      return { success: false, error: i18n.t('authErrors.noSession') };
    }
    if (user.authProvider !== 'email') {
      return {
        success: false,
        error: i18n.t('authErrors.socialPasswordChange'),
      };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);

    logger.debug('Password changed successfully');
    return { success: true };
  } catch (error: any) {
    logger.error('Change password error:', error);
    switch (error?.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return { success: false, error: i18n.t('authErrors.currentPasswordWrong') };
      case 'auth/weak-password':
        return { success: false, error: i18n.t('authErrors.newPasswordWeak') };
      case 'auth/too-many-requests':
        return { success: false, error: i18n.t('authErrors.tooManyRequests') };
      case 'auth/requires-recent-login':
        return { success: false, error: i18n.t('authErrors.requiresRecentLogin') };
      case 'auth/network-request-failed':
        return { success: false, error: i18n.t('authErrors.network') };
      default:
        return { success: false, error: i18n.t('authErrors.changePasswordFailed') };
    }
  }
}

export const emailAuthActions = {
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  changePassword,
};
