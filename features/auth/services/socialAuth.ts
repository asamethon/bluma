import { signInWithGoogle as signInWithGoogleSDK } from '@/config/googleSignIn';
import i18n from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import {
  getAuth,
  signInWithCredential,
  getIdToken,
  GoogleAuthProvider,
  AppleAuthProvider,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { notificationActions } from '../../../store/notificationStore';
import { patchAuth, User } from '@/store/slices/authSlice';
import { store } from '@/store';
import { authError, AuthResult } from './authErrors';
import { buildSignupContext, trackSignupContext } from './signupContext';
import { logger } from '@/utils/logger';

async function signInWithGoogle(): Promise<AuthResult> {
  try {
    store.dispatch(patchAuth({ isLoading: true }));
    logger.debug('Google sign in started');

    const result = await signInWithGoogleSDK();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const userInfo = result.userInfo as any;
    logger.debug('Google Sign-In userInfo:', userInfo);

    const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
    logger.debug('Google credential created');

    const authInstance = getAuth();
    const userCredential = await signInWithCredential(authInstance, credential);
    const firebaseUser = userCredential.user;
    logger.debug('Firebase user created:', firebaseUser.uid);

    let userData: User;
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      let existingUserData = userDoc.data();

      if (!existingUserData) {
        const signupContext = buildSignupContext();
        userData = {
          id: firebaseUser.uid,
          email: userInfo.data.user.email,
          displayName: userInfo.data.user.name,
          authProvider: 'google' as const,
          ...signupContext,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, userData);
        logger.debug('New user data saved to Firestore');
        trackSignupContext(signupContext);
        logEvent(getAnalytics(), 'sign_up', { method: 'google' }).catch(() => { });
      } else {
        userData = {
          ...existingUserData,
          id: firebaseUser.uid,
          email: userInfo.data.user.email,
          displayName: userInfo.data.user.name,
          authProvider: 'google' as const,
          updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: userInfo.data.user.email,
          displayName: userInfo.data.user.name,
          authProvider: 'google' as const,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        logger.debug('Existing user data updated in Firestore');
      }
    } catch (firestoreError: any) {
      logger.error('Firestore error during Google sign-in:', firestoreError);

      if (firestoreError.code === 'firestore/permission-denied') {
        logger.debug('Firestore permission denied, creating basic user object');
        userData = {
          id: firebaseUser.uid,
          email: userInfo.data.user.email,
          displayName: userInfo.data.user.name,
          authProvider: 'google' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        throw firestoreError;
      }
    }

    const token = await getIdToken(firebaseUser);
    logger.debug('Google sign in successful with Firebase');

    store.dispatch(patchAuth({ token: token }));
    store.dispatch(patchAuth({ user: userData as User }));
    store.dispatch(patchAuth({ isAuthenticated: true }));
    store.dispatch(patchAuth({ isGuest: false }));

    if (userData.username && userData.interests) {
      store.dispatch(patchAuth({ hasCompletedOnboarding: true }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      logger.debug('User has completed onboarding');
    } else {
      store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
      logger.debug('User needs to complete onboarding');

      await notificationActions.createWelcomeNotification(userData.id, userData.displayName);
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
    logger.error('Google Sign-In error:', error);
    store.dispatch(patchAuth({ isLoading: false }));

    return authError(error.code, 'authErrors.googleSignInFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function signInWithApple(credential: any): Promise<AuthResult> {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    const authInstance = getAuth();
    const db = getFirestore();

    const appleCredential = AppleAuthProvider.credential(
      credential.identityToken,
      credential.nonce
    );

    const firebaseUserCredential = await signInWithCredential(authInstance, appleCredential);
    const firebaseUser = firebaseUserCredential.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    let userData = userDoc.data();

    if (!userData) {
      const signupContext = buildSignupContext();
      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || credential.email || 'user@icloud.com',
        displayName: firebaseUser.displayName || credential.fullName?.givenName || i18n.t('common.appleUser'),
        authProvider: 'apple' as const,
        appleUserId: credential.user,
        ...signupContext,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
      logger.debug('New Apple user data saved to Firestore');
      trackSignupContext(signupContext);
      logEvent(getAnalytics(), 'sign_up', { method: 'apple' }).catch(() => { });
    } else {
      userData = {
        ...userData,
        email: firebaseUser.email || credential.email || userData.email,
        displayName: firebaseUser.displayName || credential.fullName?.givenName || userData.displayName,
        appleUserId: userData.appleUserId || credential.user,
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, {
        email: userData.email,
        displayName: userData.displayName,
        appleUserId: userData.appleUserId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      logger.debug('Existing Apple user data updated in Firestore');
    }

    const token = await getIdToken(firebaseUser);
    logger.debug('Apple sign in successful with Firebase');

    store.dispatch(patchAuth({ token: token }));
    store.dispatch(patchAuth({ user: userData as User }));
    store.dispatch(patchAuth({ isAuthenticated: true }));
    store.dispatch(patchAuth({ isGuest: false }));

    if (userData.username && userData.interests) {
      store.dispatch(patchAuth({ hasCompletedOnboarding: true }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      logger.debug('Apple user has completed onboarding');
    } else {
      store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
      logger.debug('Apple user needs to complete onboarding');

      await notificationActions.createWelcomeNotification(userData.id, userData.displayName);
    }

    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('authProvider', 'apple');
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
    logger.error('Apple sign in error:', error);
    store.dispatch(patchAuth({ isLoading: false }));

    return authError(error.code, 'authErrors.appleSignInFailed');
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

export const socialAuthActions = {
  signInWithGoogle,
  signInWithApple,
};
