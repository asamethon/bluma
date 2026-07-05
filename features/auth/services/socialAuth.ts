import { signInWithGoogle as signInWithGoogleSDK } from '@/config/googleSignIn';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Sign in with Google
async function signInWithGoogle() {
  try {
    store.dispatch(patchAuth({ isLoading: true }));
    console.log('Google sign in started');

    const result = await signInWithGoogleSDK();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const userInfo = result.userInfo as any;
    console.log('Google Sign-In userInfo:', userInfo);

    // Create Firebase credential
    const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
    console.log('Google credential created');

    // Sign in to Firebase
    const authInstance = getAuth();
    const userCredential = await signInWithCredential(authInstance, credential);
    const firebaseUser = userCredential.user;
    console.log('Firebase user created:', firebaseUser.uid);

    // Get or create user data in Firestore
    let userData: User;
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      let existingUserData = userDoc.data();

      if (!existingUserData) {
        // Create new user data
        userData = {
          id: firebaseUser.uid,
          email: userInfo.data.user.email,
          displayName: userInfo.data.user.name,
          authProvider: 'google' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Save to Firestore
        await setDoc(userDocRef, userData);
        console.log('New user data saved to Firestore');
      } else {
        // Update existing user data
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
        console.log('Existing user data updated in Firestore');
      }
    } catch (firestoreError: any) {
      console.error('Firestore error during Google sign-in:', firestoreError);

      // If Firestore is not accessible, create a basic user object
      if (firestoreError.code === 'firestore/permission-denied') {
        console.log('Firestore permission denied, creating basic user object');
        userData = {
          id: firebaseUser.uid,
          email: userInfo.data.user.email,
          displayName: userInfo.data.user.name,
          authProvider: 'google' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        // Re-throw other Firestore errors
        throw firestoreError;
      }
    }

    // Get Firebase token
    const token = await getIdToken(firebaseUser);
    console.log('Google sign in successful with Firebase');

    // Update state
    store.dispatch(patchAuth({ token: token }));
    store.dispatch(patchAuth({ user: userData as User }));
    store.dispatch(patchAuth({ isAuthenticated: true }));
    store.dispatch(patchAuth({ isGuest: false }));

    // Check if user has completed onboarding
    if (userData.username && userData.interests) {
      store.dispatch(patchAuth({ hasCompletedOnboarding: true }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      console.log('User has completed onboarding');
    } else {
      store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
      console.log('User needs to complete onboarding');

      // Create welcome notification for new users
      await notificationActions.createWelcomeNotification(userData.id, userData.displayName);
    }

    // Save to AsyncStorage
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));

    // Save push token
    try {
      const { pushNotificationService } = await import('@/services/pushNotificationService');
      await pushNotificationService.saveUserPushToken(firebaseUser.uid);
    } catch (error) {
      console.log('Push token kaydedilirken hata (non-critical):', error);
    }

    // Set loading to false before returning
    store.dispatch(patchAuth({ isLoading: false }));

    return { success: true };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    store.dispatch(patchAuth({ isLoading: false }));

    if (error.code === 'auth/account-exists-with-different-credential') {
      return { success: false, error: 'Bu e-posta adresi farklı bir yöntemle kayıtlı.' };
    } else if (error.code === 'auth/invalid-credential') {
      return { success: false, error: 'Geçersiz kimlik bilgileri.' };
    } else if (error.code === 'auth/operation-not-allowed') {
      return { success: false, error: 'Google ile giriş etkin değil.' };
    } else if (error.code === 'auth/user-disabled') {
      return { success: false, error: 'Hesap devre dışı bırakılmış.' };
    } else if (error.code === 'auth/user-not-found') {
      return { success: false, error: 'Kullanıcı bulunamadı.' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Zayıf şifre.' };
    } else if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Bu e-posta adresi zaten kullanımda.' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Geçersiz e-posta adresi.' };
    } else if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Ağ bağlantısı hatası.' };
    } else if (error.code === 'auth/internal-error') {
      return { success: false, error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' };
    } else if (error.code === 'firestore/permission-denied') {
      return { success: false, error: 'Veritabanı erişim hatası.' };
    } else {
      return { success: false, error: 'Google ile giriş yapılırken bir hata oluştu.' };
    }
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

// Sign in with Apple
async function signInWithApple(credential: any) {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    const authInstance = getAuth();
    const db = getFirestore();

    // Create Firebase credential for Apple
    const appleCredential = AppleAuthProvider.credential(
      credential.identityToken,
      credential.nonce
    );

    // Sign in to Firebase with Apple credential
    const firebaseUserCredential = await signInWithCredential(authInstance, appleCredential);
    const firebaseUser = firebaseUserCredential.user;

    // Get or create user data in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    let userData = userDoc.data();

    if (!userData) {
      // Create new user data
      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || credential.email || 'user@icloud.com',
        displayName: firebaseUser.displayName || credential.fullName?.givenName || 'Apple User',
        authProvider: 'apple' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to Firestore
      await setDoc(userDocRef, userData);
      console.log('New Apple user data saved to Firestore');
    } else {
      // Update existing user data
      userData = {
        ...userData,
        email: firebaseUser.email || credential.email || userData.email,
        displayName: firebaseUser.displayName || credential.fullName?.givenName || userData.displayName,
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, {
        email: userData.email,
        displayName: userData.displayName,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log('Existing Apple user data updated in Firestore');
    }

    // Get Firebase token
    const token = await getIdToken(firebaseUser);
    console.log('Apple sign in successful with Firebase');

    // Update state
    store.dispatch(patchAuth({ token: token }));
    store.dispatch(patchAuth({ user: userData as User }));
    store.dispatch(patchAuth({ isAuthenticated: true }));
    store.dispatch(patchAuth({ isGuest: false }));

    // Check if user has completed onboarding
    if (userData.username && userData.interests) {
      store.dispatch(patchAuth({ hasCompletedOnboarding: true }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      console.log('Apple user has completed onboarding');
    } else {
      store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
      console.log('Apple user needs to complete onboarding');

      // Create welcome notification for new users
      await notificationActions.createWelcomeNotification(userData.id, userData.displayName);
    }

    // Save to AsyncStorage
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('authProvider', 'apple');
    await AsyncStorage.setItem('userData', JSON.stringify(userData));

    // Save push token
    try {
      const { pushNotificationService } = await import('@/services/pushNotificationService');
      await pushNotificationService.saveUserPushToken(firebaseUser.uid);
    } catch (error) {
      console.log('Push token kaydedilirken hata (non-critical):', error);
    }

    // Set loading to false before returning
    store.dispatch(patchAuth({ isLoading: false }));

    return { success: true };
  } catch (error: any) {
    console.error('Apple sign in error:', error);
    store.dispatch(patchAuth({ isLoading: false }));

    if (error.code === 'auth/account-exists-with-different-credential') {
      return { success: false, error: 'Bu e-posta adresi farklı bir yöntemle kayıtlı.' };
    } else if (error.code === 'auth/invalid-credential') {
      return { success: false, error: 'Geçersiz kimlik bilgileri.' };
    } else if (error.code === 'auth/operation-not-allowed') {
      return { success: false, error: 'Apple ile giriş etkin değil.' };
    } else if (error.code === 'auth/user-disabled') {
      return { success: false, error: 'Hesap devre dışı bırakılmış.' };
    } else if (error.code === 'auth/user-not-found') {
      return { success: false, error: 'Kullanıcı bulunamadı.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Ağ bağlantısı hatası.' };
    } else if (error.code === 'auth/internal-error') {
      return { success: false, error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' };
    } else if (error.code === 'firestore/permission-denied') {
      return { success: false, error: 'Veritabanı erişim hatası.' };
    } else {
      return { success: false, error: 'Apple ile giriş yapılırken bir hata oluştu.' };
    }
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

export const socialAuthActions = {
  signInWithGoogle,
  signInWithApple,
};
