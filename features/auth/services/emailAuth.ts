import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { authState$, User } from '../../../store/authStore';

// Sign in with email
async function signInWithEmail(email: string, password: string) {
  try {
    authState$.isLoading.set(true);

    const authInstance = getAuth();
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const firebaseUser = userCredential.user;

    // Get user data from Firestore
    const db = getFirestore();
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    let userData = userDoc.data();

    if (!userData) {
      // Create user data if it doesn't exist
      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        authProvider: 'email' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
    }

    // Get Firebase token
    const token = await getIdToken(firebaseUser);

    // Update state
    authState$.token.set(token);
    authState$.user.set(userData as User);
    authState$.isAuthenticated.set(true);
    authState$.isGuest.set(false);

    // Check if user has completed onboarding
    if (userData.username && userData.interests) {
      authState$.hasCompletedOnboarding.set(true);
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    } else {
      authState$.hasCompletedOnboarding.set(false);
      await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
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
    authState$.isLoading.set(false);

    return { success: true };
  } catch (error: any) {
    console.error('Email sign in error:', error);

    if (error.code === 'auth/user-not-found') {
      return { success: false, error: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.' };
    } else if (error.code === 'auth/wrong-password') {
      return { success: false, error: 'Hatalı şifre.' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Geçersiz e-posta adresi.' };
    } else if (error.code === 'auth/user-disabled') {
      return { success: false, error: 'Hesap devre dışı bırakılmış.' };
    } else if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Ağ bağlantısı hatası.' };
    } else if (error.code === 'auth/internal-error') {
      return { success: false, error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' };
    } else if (error.code === 'firestore/permission-denied') {
      return { success: false, error: 'Veritabanı erişim hatası.' };
    } else {
      return { success: false, error: 'Giriş yapılırken bir hata oluştu.' };
    }
  } finally {
    authState$.isLoading.set(false);
  }
}

// Sign up with email
async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    authState$.isLoading.set(true);

    const authInstance = getAuth();
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const firebaseUser = userCredential.user;

    // Update Firebase profile
    await updateProfile(firebaseUser, {
      displayName: displayName,
    });

    // Create user data
    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: displayName,
      authProvider: 'email' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save to Firestore
    const db = getFirestore();
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, userData);

    // Get Firebase token
    const token = await getIdToken(firebaseUser);

    // Update state
    authState$.token.set(token);
    authState$.user.set(userData as User);
    authState$.isAuthenticated.set(true);
    authState$.isGuest.set(false);
    authState$.hasCompletedOnboarding.set(false); // New user needs onboarding

    // Save to AsyncStorage
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    await AsyncStorage.setItem('hasCompletedOnboarding', 'false');

    // Save push token
    try {
      const { pushNotificationService } = await import('@/services/pushNotificationService');
      await pushNotificationService.saveUserPushToken(firebaseUser.uid);
    } catch (error) {
      console.log('Push token kaydedilirken hata (non-critical):', error);
    }

    // Set loading to false before returning
    authState$.isLoading.set(false);

    return { success: true };
  } catch (error: any) {
    console.error('Email sign up error:', error);

    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Bu e-posta adresi zaten kullanımda.' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Geçersiz e-posta adresi.' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Şifre en az 6 karakter olmalıdır.' };
    } else if (error.code === 'auth/operation-not-allowed') {
      return { success: false, error: 'E-posta ile kayıt etkin değil.' };
    } else if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Ağ bağlantısı hatası.' };
    } else if (error.code === 'auth/internal-error') {
      return { success: false, error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' };
    } else if (error.code === 'firestore/permission-denied') {
      return { success: false, error: 'Veritabanı erişim hatası.' };
    } else {
      return { success: false, error: 'Kayıt olurken bir hata oluştu.' };
    }
  } finally {
    authState$.isLoading.set(false);
  }
}

// Reset password
async function resetPassword(email: string) {
  try {
    authState$.isLoading.set(true);

    // Send password reset email
    await sendPasswordResetEmail(getAuth(), email);

    console.log('Password reset email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);

    if (error.code === 'auth/user-not-found') {
      return { success: false, error: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Geçersiz e-posta adresi.' };
    } else if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Ağ bağlantısı hatası.' };
    } else {
      return { success: false, error: 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu.' };
    }
  } finally {
    authState$.isLoading.set(false);
  }
}

// Change password (email accounts only) — reauthenticate, then update.
async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const user = authState$.user.get();
    const firebaseUser = getAuth().currentUser;
    if (!user || !firebaseUser) {
      return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' };
    }
    if (user.authProvider !== 'email') {
      return {
        success: false,
        error: 'Bu hesap Google/Apple ile oluşturulduğu için uygulama içinden şifre değiştirilemez.',
      };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);

    console.log('Password changed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Change password error:', error);
    switch (error?.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return { success: false, error: 'Mevcut şifren yanlış.' };
      case 'auth/weak-password':
        return { success: false, error: 'Yeni şifre çok zayıf. En az 6 karakter olmalı.' };
      case 'auth/too-many-requests':
        return { success: false, error: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar dene.' };
      case 'auth/requires-recent-login':
        return { success: false, error: 'Güvenlik için tekrar giriş yapman gerekiyor.' };
      case 'auth/network-request-failed':
        return { success: false, error: 'Ağ bağlantısı hatası.' };
      default:
        return { success: false, error: 'Şifre değiştirilirken bir hata oluştu.' };
    }
  }
}

export const emailAuthActions = {
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  changePassword,
};
