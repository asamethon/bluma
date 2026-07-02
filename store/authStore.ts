import { signInWithGoogle, signOutFromGoogle } from '@/config/googleSignIn';
import { observable } from '@legendapp/state';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { notificationActions } from './notificationStore';

export interface User {
  id: string;
  email: string;
  displayName: string;
  username?: string;
  bio?: string;
  interests?: string[];
  website?: string;
  location?: string;
  authProvider: 'email' | 'google' | 'apple';
  followersCount?: number;
  followingCount?: number;
  storiesCount?: number;
  profileImage?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isGuest: boolean;
  user: User | null;
  token: string | null;
}

// Create observable state
export const authState$ = observable<AuthState>({
  isLoading: true, // true until initializeAuth() completes
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isGuest: false,
  user: null,
  token: null,
});

// Auth actions
export const authActions = {
    // Initialize auth state from AsyncStorage
  async initializeAuth() {
    try {
      console.log('Starting auth initialization...');

      authState$.isLoading.set(true);
      authState$.isAuthenticated.set(false);
      authState$.hasCompletedOnboarding.set(false);
      authState$.user.set(null);
      authState$.token.set(null);

      try {
        if (!auth || typeof auth !== 'function') {
          console.log('Firebase auth not available');
          return;
        }

        // Wait for Firebase to restore auth state from persistence
        const currentUser = await new Promise<any>((resolve) => {
          const unsubscribe = auth().onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
        });
        console.log('Firebase auth restored:', currentUser ? currentUser.uid : 'none');
        
        if (currentUser) {
          try {
            // User is signed in to Firebase
            const token = await currentUser.getIdToken();
            console.log('Got Firebase token');
            
            // Update state
            authState$.token.set(token);
            authState$.isAuthenticated.set(true);
            authState$.isGuest.set(false);

            // Try to get user data from Firestore (optional)
            try {
              if (firestore && typeof firestore === 'function') {
                const userDocRef = firestore().collection('users').doc(currentUser.uid);
                const userDoc = await userDocRef.get();
                
                if (userDoc.exists()) {
                  const userData = userDoc.data() as User;
                  authState$.user.set(userData);
                  
                  if (userData.username && userData.interests) {
                    authState$.hasCompletedOnboarding.set(true);
                  }
                } else {
                  // User exists in Firebase but not in Firestore - create user document
                  console.log('User exists in Firebase but not in Firestore, creating user document');
                  try {
                    const newUser: User = {
                      id: currentUser.uid,
                      email: currentUser.email || '',
                      displayName: currentUser.displayName || 'Kullanıcı',
                      authProvider: 'google',
                      createdAt: firestore.FieldValue.serverTimestamp(),
                      updatedAt: firestore.FieldValue.serverTimestamp(),
                    };
                    
                    await userDocRef.set(newUser);
                    authState$.user.set(newUser);
                    console.log('User document created successfully');
                  } catch (createError) {
                    console.log('Error creating user document:', createError);
                    // Don't fail auth if we can't create user document
                  }
                }
                
                // Save push token
                try {
                  const { pushNotificationService } = await import('@/services/pushNotificationService');
                  await pushNotificationService.saveUserPushToken(currentUser.uid);
                } catch (pushError) {
                  console.log('Push token kaydedilirken hata (non-critical):', pushError);
                }
              }
            } catch (firestoreError) {
              console.log('Firestore error (non-critical):', firestoreError);
              // Don't fail auth if Firestore is not accessible
            }
            
            console.log('Firebase auth initialization successful');
          } catch (firebaseError: any) {
            console.error('Error with Firebase user:', firebaseError);
            
            // Handle specific Firebase errors
            if (firebaseError.code === 'auth/user-not-found') {
              console.log('Firebase user not found, clearing local data');
              // Clear any stale local data and sign out
              try {
                await auth().signOut();
                await AsyncStorage.multiRemove([
                  'userToken',
                  'userData',
                  'authProvider',
                  'hasCompletedOnboarding',
                ]);
              } catch (clearError) {
                console.log('Error clearing local data:', clearError);
              }
              
              // Reset state to ensure clean slate
              authState$.set({
                isLoading: false,
                isAuthenticated: false,
                hasCompletedOnboarding: false,
                isGuest: false,
                user: null,
                token: null,
              });
              return;
            }
            
            // Don't crash, just continue without Firebase
          }
        } else {
          // No Firebase user, clear any stale local data
          console.log('No Firebase user, clearing local data');
          try {
            await AsyncStorage.multiRemove([
              'userToken',
              'userData',
              'authProvider',
              'hasCompletedOnboarding',
            ]);
          } catch (clearError) {
            console.log('Error clearing local data:', clearError);
          }
        }
      } catch (firebaseError) {
        console.log('Firebase not available, continuing without it:', firebaseError);
        // Clear any stale local data when Firebase is not available
        try {
          await AsyncStorage.multiRemove([
            'userToken',
            'userData',
            'authProvider',
            'hasCompletedOnboarding',
          ]);
        } catch (clearError) {
          console.log('Error clearing local data:', clearError);
        }
      }
      
      // Don't try to restore from AsyncStorage if Firebase is not working
      // This prevents the onboarding loop issue
      
    } catch (error) {
      console.error('Critical error initializing auth:', error);
      // Already set safe defaults above
    } finally {
      console.log('Auth initialization completed');
      authState$.isLoading.set(false);
    }
  },

  // Sign in with email
  async signInWithEmail(email: string, password: string) {
    try {
      authState$.isLoading.set(true);
      
              const authInstance = auth();
        const userCredential = await authInstance.signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const db = firestore();
      const userDocRef = db.collection('users').doc(firebaseUser.uid);
      const userDoc = await userDocRef.get();
      let userData = userDoc.data();
      
      if (!userData) {
        // Create user data if it doesn't exist
        userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          authProvider: 'email' as const,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        
        await userDocRef.set(userData);
      }
      
      // Get Firebase token
      const token = await firebaseUser.getIdToken();
      
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
  },

  // Sign up with email
  async signUpWithEmail(email: string, password: string, displayName: string) {
    try {
      authState$.isLoading.set(true);
      
              const authInstance = auth();
        const userCredential = await authInstance.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Update Firebase profile
      await firebaseUser.updateProfile({
        displayName: displayName,
      });
      
      // Create user data
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: displayName,
        authProvider: 'email' as const,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      // Save to Firestore
      const db = firestore();
      const userDocRef = db.collection('users').doc(firebaseUser.uid);
      await userDocRef.set(userData);
      
      // Get Firebase token
      const token = await firebaseUser.getIdToken();
      
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
  },

  // Sign in with Google
  async signInWithGoogle() {
    try {
      authState$.isLoading.set(true);
      console.log('Google sign in started');
      
      const result = await signInWithGoogle();
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      const userInfo = result.userInfo as any;
      console.log('Google Sign-In userInfo:', userInfo);
      
      // Create Firebase credential
      const credential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
      console.log('Google credential created');
      
      // Sign in to Firebase
              const authInstance = auth();
        const userCredential = await authInstance.signInWithCredential(credential);
      const firebaseUser = userCredential.user;
      console.log('Firebase user created:', firebaseUser.uid);
      
      // Get or create user data in Firestore
      let userData: User;
      try {
        const db = firestore();
        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        const userDoc = await userDocRef.get();
        let existingUserData = userDoc.data();
        
        if (!existingUserData) {
          // Create new user data
          userData = {
            id: firebaseUser.uid,
            email: userInfo.data.user.email,
            displayName: userInfo.data.user.name,
            authProvider: 'google' as const,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          };
          
          // Save to Firestore
          await userDocRef.set(userData);
          console.log('New user data saved to Firestore');
        } else {
          // Update existing user data
          userData = {
            ...existingUserData,
            id: firebaseUser.uid,
            email: userInfo.data.user.email,
            displayName: userInfo.data.user.name,
            authProvider: 'google' as const,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          };
          
          await userDocRef.set({
            id: firebaseUser.uid,
            email: userInfo.data.user.email,
            displayName: userInfo.data.user.name,
            authProvider: 'google' as const,
            updatedAt: firestore.FieldValue.serverTimestamp(),
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
      const token = await firebaseUser.getIdToken();
      console.log('Google sign in successful with Firebase');
      
      // Update state
      authState$.token.set(token);
      authState$.user.set(userData as User);
      authState$.isAuthenticated.set(true);
      authState$.isGuest.set(false);
      
      // Check if user has completed onboarding
      if (userData.username && userData.interests) {
        authState$.hasCompletedOnboarding.set(true);
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        console.log('User has completed onboarding');
      } else {
        authState$.hasCompletedOnboarding.set(false);
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
      authState$.isLoading.set(false);
      
      return { success: true };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      authState$.isLoading.set(false);
      
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
      authState$.isLoading.set(false);
    }
  },

  // Sign in with Apple
  async signInWithApple(credential: any) {
    try {
      authState$.isLoading.set(true);
      
      const authInstance = auth();
      const db = firestore();
      
      // Create Firebase credential for Apple
      const appleCredential = auth.AppleAuthProvider.credential(
        credential.identityToken,
        credential.nonce
      );
      
      // Sign in to Firebase with Apple credential
      const firebaseUserCredential = await authInstance.signInWithCredential(appleCredential);
      const firebaseUser = firebaseUserCredential.user;
      
      // Get or create user data in Firestore
      const userDocRef = db.collection('users').doc(firebaseUser.uid);
      const userDoc = await userDocRef.get();
      let userData = userDoc.data();
      
      if (!userData) {
        // Create new user data
        userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || credential.email || 'user@icloud.com',
          displayName: firebaseUser.displayName || credential.fullName?.givenName || 'Apple User',
          authProvider: 'apple' as const,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        
        // Save to Firestore
        await userDocRef.set(userData);
        console.log('New Apple user data saved to Firestore');
      } else {
        // Update existing user data
        userData = {
          ...userData,
          email: firebaseUser.email || credential.email || userData.email,
          displayName: firebaseUser.displayName || credential.fullName?.givenName || userData.displayName,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        
        await userDocRef.set({
          email: userData.email,
          displayName: userData.displayName,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log('Existing Apple user data updated in Firestore');
      }
      
      // Get Firebase token
      const token = await firebaseUser.getIdToken();
      console.log('Apple sign in successful with Firebase');
      
      // Update state
      authState$.token.set(token);
      authState$.user.set(userData as User);
      authState$.isAuthenticated.set(true);
      authState$.isGuest.set(false);
      
      // Check if user has completed onboarding
      if (userData.username && userData.interests) {
        authState$.hasCompletedOnboarding.set(true);
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        console.log('Apple user has completed onboarding');
      } else {
        authState$.hasCompletedOnboarding.set(false);
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
      authState$.isLoading.set(false);
      
      return { success: true };
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      authState$.isLoading.set(false);
      
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
      authState$.isLoading.set(false);
    }
  },

  // Check if username is available
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const db = firestore();
      const usersRef = db.collection('users');
      const q = usersRef.where('username', '==', username);
      const querySnapshot = await q.get();
      
      return querySnapshot.empty; // true if username is available, false if taken
    } catch (error: any) {
      console.error('Username availability check error:', error);
      
      // If Firestore permission denied, assume username is available to allow signup to continue
      if (error.code === 'firestore/permission-denied') {
        console.log('Firestore permission denied, assuming username is available');
        return true;
      }
      
      // For other errors, assume taken to be safe
      return false;
    }
  },

  // Follow a user
  async followUser(userIdToFollow: string) {
    try {
      const currentUser = authState$.user.get();
      if (!currentUser) return { success: false, error: 'Kullanıcı bulunamadı.' };

      const db = firestore();

      // Asıl takip ilişkisi: iki doküman paralel yazılır. Yalnızca bunlar
      // beklenir — sayaçlar ve bildirim arka planda yürür ki buton saniyelerce
      // dönmesin (push bildirimi HTTP çağrısı tek başına 1-3 sn sürebiliyor).
      const currentUserFollowingRef = db.collection('users').doc(currentUser.id).collection('following').doc(userIdToFollow);
      const targetUserFollowersRef = db.collection('users').doc(userIdToFollow).collection('followers').doc(currentUser.id);
      await Promise.all([
        currentUserFollowingRef.set({
          userId: userIdToFollow,
          followedAt: firestore.FieldValue.serverTimestamp(),
        }),
        targetUserFollowersRef.set({
          userId: currentUser.id,
          followedAt: firestore.FieldValue.serverTimestamp(),
        }),
      ]);

      // Sayaçlar — atomik increment, arka planda; hata takibi bozmaz.
      db.collection('users').doc(currentUser.id).update({
        followingCount: firestore.FieldValue.increment(1),
      }).catch((e: any) => console.error('Following count update error:', e));
      db.collection('users').doc(userIdToFollow).update({
        followersCount: firestore.FieldValue.increment(1),
      }).catch((e: any) => console.error('Followers count update error:', e));

      // Bildirim (in-app + push) — arka planda.
      notificationActions.createFollowNotification(
        currentUser.id,
        userIdToFollow,
        currentUser.displayName
      ).catch((e: any) => console.error('Follow notification error:', e));

      // Update local state
      authState$.user.set({
        ...currentUser,
        followingCount: (currentUser.followingCount || 0) + 1,
      });

      return { success: true };
    } catch (error) {
      console.error('Follow user error:', error);
      return { success: false, error: 'Takip edilirken bir hata oluştu.' };
    }
  },

  // Unfollow a user
  async unfollowUser(userIdToUnfollow: string) {
    try {
      const currentUser = authState$.user.get();
      if (!currentUser) return { success: false, error: 'Kullanıcı bulunamadı.' };

      const db = firestore();

      // İlişki dokümanları paralel silinir; sayaçlar arka planda (bkz. followUser).
      const currentUserFollowingRef = db.collection('users').doc(currentUser.id).collection('following').doc(userIdToUnfollow);
      const targetUserFollowersRef = db.collection('users').doc(userIdToUnfollow).collection('followers').doc(currentUser.id);
      await Promise.all([
        currentUserFollowingRef.delete(),
        targetUserFollowersRef.delete(),
      ]);

      db.collection('users').doc(currentUser.id).update({
        followingCount: firestore.FieldValue.increment(-1),
      }).catch((e: any) => console.error('Following count update error:', e));
      db.collection('users').doc(userIdToUnfollow).update({
        followersCount: firestore.FieldValue.increment(-1),
      }).catch((e: any) => console.error('Followers count update error:', e));

      // Update local state
      authState$.user.set({
        ...currentUser,
        followingCount: Math.max((currentUser.followingCount || 0) - 1, 0),
      });

      return { success: true };
    } catch (error) {
      console.error('Unfollow user error:', error);
      return { success: false, error: 'Takipten çıkılırken bir hata oluştu.' };
    }
  },

  // Check if current user is following another user
  async isFollowingUser(userId: string): Promise<boolean> {
    try {
      const currentUser = authState$.user.get();
      if (!currentUser) return false;

      const db = firestore();
      const followingRef = db.collection('users').doc(currentUser.id).collection('following').doc(userId);
      const followingDoc = await followingRef.get();
      
      return followingDoc.exists();
    } catch (error) {
      console.error('Check following error:', error);
      return false;
    }
  },

  // Get user followers count
  async getUserFollowersCount(userId: string): Promise<number> {
    try {
      const db = firestore();
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      return userData?.followersCount || 0;
    } catch (error) {
      console.error('Get followers count error:', error);
      return 0;
    }
  },

  // Search users by username or display name
  async searchUsers(searchQuery: string): Promise<User[]> {
    try {
      const db = firestore();
      const usersRef = db.collection('users');
      
      // Clean search query
      const cleanQuery = searchQuery.toLowerCase().trim();
      if (cleanQuery.length < 2) {
        return []; // Minimum 2 karakter gerekli
      }
      
      const users: User[] = [];
      
      // Search by username (exact match first, then contains)
      const exactUsernameQuery = usersRef.where('username', '==', cleanQuery);
      const exactUsernameSnapshot = await exactUsernameQuery.get();
      
      // Search by username (contains - for partial matches)
      const usernameQuery = usersRef.where('username', '>=', cleanQuery).where('username', '<=', cleanQuery + '\uf8ff');
      const usernameSnapshot = await usernameQuery.get();

      // Search by display name (contains). displayName b\u00fcy\u00fck harfle
      // saklanabildi\u011fi i\u00e7in hem k\u00fc\u00e7\u00fck harfli hem ba\u015f harfi b\u00fcy\u00fck varyant\u0131
      // sorgulan\u0131r ("samet" \u2192 "Samet"); aksi h\u00e2lde range sorgusu hi\u00e7 e\u015fle\u015fmez.
      const capitalizedQuery =
        cleanQuery.charAt(0).toLocaleUpperCase('tr-TR') + cleanQuery.slice(1);
      const displayNameVariants = Array.from(new Set([cleanQuery, capitalizedQuery]));
      const displayNameSnapshots = await Promise.all(
        displayNameVariants.map(v =>
          usersRef.where('displayName', '>=', v).where('displayName', '<=', v + '\uf8ff').get()
        )
      );
      
      // Add exact username matches first (highest priority)
      exactUsernameSnapshot.forEach((doc: any) => {
        const userData = { id: doc.id, ...doc.data() } as User;
        if (!users.find(user => user.id === userData.id)) {
          users.push(userData);
        }
      });
      
      // Add partial username matches
      usernameSnapshot.forEach((doc: any) => {
        const userData = { id: doc.id, ...doc.data() } as User;
        if (!users.find(user => user.id === userData.id)) {
          users.push(userData);
        }
      });
      
      // Add display name matches (avoid duplicates)
      displayNameSnapshots.forEach(snapshot => {
        snapshot.forEach((doc: any) => {
          const userData = { id: doc.id, ...doc.data() } as User;
          if (!users.find(user => user.id === userData.id)) {
            users.push(userData);
          }
        });
      });
      
      // Sort results: exact matches first, then by relevance
      users.sort((a, b) => {
        const aUsername = a.username?.toLowerCase() || '';
        const bUsername = b.username?.toLowerCase() || '';
        const aDisplayName = a.displayName?.toLowerCase() || '';
        const bDisplayName = b.displayName?.toLowerCase() || '';
        
        // Exact username match gets highest priority
        if (aUsername === cleanQuery && bUsername !== cleanQuery) return -1;
        if (bUsername === cleanQuery && aUsername !== cleanQuery) return 1;
        
        // Username starts with query gets higher priority
        if (aUsername.startsWith(cleanQuery) && !bUsername.startsWith(cleanQuery)) return -1;
        if (bUsername.startsWith(cleanQuery) && !aUsername.startsWith(cleanQuery)) return 1;
        
        // Display name starts with query gets higher priority
        if (aDisplayName.startsWith(cleanQuery) && !bDisplayName.startsWith(cleanQuery)) return -1;
        if (bDisplayName.startsWith(cleanQuery) && !aDisplayName.startsWith(cleanQuery)) return 1;
        
        // Sort by follower count (more popular users first)
        return (b.followersCount || 0) - (a.followersCount || 0);
      });
      
      return users.slice(0, 20); // Limit to 20 results
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const db = firestore();
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      
      return null;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  },

  // Complete onboarding
  async completeOnboarding(userData: { username: string; interests: string[]; bio: string }) {
    try {
      authState$.isLoading.set(true);
      
      const db = firestore();
      
      // Check if username is available
      const isUsernameAvailable = await authActions.checkUsernameAvailability(userData.username);
      if (!isUsernameAvailable) {
        return { success: false, error: 'Bu kullanıcı adı zaten kullanımda.' };
      }
      
      // Update user data
      const currentUser = authState$.user.get();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          username: userData.username,
          bio: userData.bio,
          interests: userData.interests,
        };
        
        // Save to Firestore
        const userDocRef = db.collection('users').doc(currentUser.id);
        await userDocRef.set({
          ...updatedUser,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        
        // Update state
        authState$.user.set(updatedUser);
        authState$.hasCompletedOnboarding.set(true);
        
        console.log('Onboarding completed successfully');
        return { success: true };
      }
      
    } catch (error) {
      console.error('Onboarding error:', error);
      return { success: false, error: 'Profil oluşturulurken bir hata oluştu.' };
    } finally {
      authState$.isLoading.set(false);
    }
  },

  // Update user profile
  async updateUserProfile(updatedUser: User) {
    try {
      authState$.isLoading.set(true);
      
      const db = firestore();
      
      // Save to Firestore
      const userDocRef = db.collection('users').doc(updatedUser.id);
      await userDocRef.set({
        ...updatedUser,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      // Update state
      authState$.user.set(updatedUser);
      
      console.log('Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Profil güncellenirken bir hata oluştu.' };
    } finally {
      authState$.isLoading.set(false);
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      authState$.isLoading.set(true);
      
      // Send password reset email
      await auth().sendPasswordResetEmail(email);
      
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
  },

  // Change password (email accounts only) — reauthenticate, then update.
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const user = authState$.user.get();
      const firebaseUser = auth().currentUser;
      if (!user || !firebaseUser) {
        return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' };
      }
      if (user.authProvider !== 'email') {
        return {
          success: false,
          error: 'Bu hesap Google/Apple ile oluşturulduğu için uygulama içinden şifre değiştirilemez.',
        };
      }

      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await firebaseUser.reauthenticateWithCredential(credential);
      await firebaseUser.updatePassword(newPassword);

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
  },

  // Sign out
  async signOut() {
    try {
      // Set loading to true during sign out
      authState$.isLoading.set(true);
      
      // Sign out from Firebase
      await auth().signOut();
      
      // Sign out from Google if user was signed in with Google
      const authProvider = await AsyncStorage.getItem('authProvider');
      if (authProvider === 'google') {
        await signOutFromGoogle();
      }
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        'userToken',
        'authProvider',
        'userData',
        'hasCompletedOnboarding',
      ]);
      
      // Reset state
      authState$.isAuthenticated.set(false);
      authState$.hasCompletedOnboarding.set(false);
      authState$.isGuest.set(false);
      authState$.user.set(null);
      authState$.token.set(null);
      authState$.isLoading.set(false);

      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      // Ensure loading is set to false even on error
      authState$.isLoading.set(false);
    }
  },

  continueAsGuest() {
    authState$.isGuest.set(true);
    authState$.isAuthenticated.set(false);
    authState$.hasCompletedOnboarding.set(false);
    authState$.isLoading.set(false);
  },

  // Check if user is fully authenticated (signed in + onboarded)
  isFullyAuthenticated(): boolean {
    const state = authState$.get();
    return state.isAuthenticated && state.hasCompletedOnboarding;
  },

  // User real-time listener
  setupUserListener(userId: string) {
    try {
      if (!userId || typeof userId !== 'string') {
        console.log('Invalid userId for user listener');
        return;
      }

      const db = firestore();
      const userDocRef = db.collection('users').doc(userId);
      
      const unsubscribe = userDocRef.onSnapshot((doc) => {
        if (doc.exists()) {
          const userData = doc.data() as User;
          authState$.user.set(userData);
          console.log('User data updated in real-time');
        }
      }, (error: any) => {
        console.error('User listener error:', error);
        
        // If Firestore permission denied, don't crash the app
        if (error.code === 'firestore/permission-denied') {
          console.log('User listener: Firestore permission denied, continuing without real-time updates');
        }
      });

      // Store unsubscribe function for cleanup
      (authActions as any).userUnsubscribe = unsubscribe;
    } catch (error) {
      console.error('Error setting up user listener:', error);
    }
  },

  // Cleanup user listener
  cleanupUserListener() {
    try {
      if ((authActions as any).userUnsubscribe) {
        (authActions as any).userUnsubscribe();
        (authActions as any).userUnsubscribe = null;
      }
    } catch (error) {
      console.error('Error cleaning up user listener:', error);
    }
  },

  // Delete user account
  async deleteAccount(password?: string) {
    try {
      authState$.isLoading.set(true);
      
      const currentUser = authState$.user.get();
      if (!currentUser) {
        return { success: false, error: 'Kullanıcı bulunamadı.' };
      }

      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        return { success: false, error: 'Firebase kullanıcısı bulunamadı.' };
      }

      // If password is provided, re-authenticate user
      if (password && currentUser.authProvider === 'email') {
        try {
          const credential = auth.EmailAuthProvider.credential(currentUser.email, password);
          await firebaseUser.reauthenticateWithCredential(credential);
          console.log('User re-authenticated successfully');
        } catch (reauthError: any) {
          if (reauthError.code === 'auth/wrong-password') {
            return { success: false, error: 'Hatalı şifre.' };
          } else if (reauthError.code === 'auth/user-mismatch') {
            return { success: false, error: 'Kullanıcı bilgileri eşleşmiyor.' };
          } else {
            return { success: false, error: 'Kimlik doğrulama hatası.' };
          }
        }
      }

      const db = firestore();
      
      // Delete user's stories
      const storiesRef = db.collection('stories').where('authorId', '==', currentUser.id);
      const storiesSnapshot = await storiesRef.get();
      const storyDeletionPromises = storiesSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(storyDeletionPromises);
      
      // Delete user's conversations
      const conversationsRef = db.collection('conversations').where('authorId', '==', currentUser.id);
      const conversationsSnapshot = await conversationsRef.get();
      const conversationDeletionPromises = conversationsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(conversationDeletionPromises);
      
      // Delete user's followers/following relationships
      const followersRef = db.collection('users').doc(currentUser.id).collection('followers');
      const followingRef = db.collection('users').doc(currentUser.id).collection('following');
      
      const followersSnapshot = await followersRef.get();
      const followingSnapshot = await followingRef.get();
      
      const followerDeletionPromises = followersSnapshot.docs.map(doc => doc.ref.delete());
      const followingDeletionPromises = followingSnapshot.docs.map(doc => doc.ref.delete());
      
      await Promise.all([...followerDeletionPromises, ...followingDeletionPromises]);
      
      // Delete user document
      await db.collection('users').doc(currentUser.id).delete();
      
      // Delete Firebase auth user
      await firebaseUser.delete();
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        'userToken',
        'authProvider',
        'userData',
        'hasCompletedOnboarding',
      ]);
      
      // Reset state
      authState$.isAuthenticated.set(false);
      authState$.hasCompletedOnboarding.set(false);
      authState$.user.set(null);
      authState$.token.set(null);
      authState$.isLoading.set(false);
      
      console.log('Account deletion successful');
      return { success: true };
    } catch (error: any) {
      console.error('Account deletion error:', error);
      authState$.isLoading.set(false);
      
      if (error.code === 'auth/requires-recent-login') {
        return { success: false, error: 'Hesap silmek için şifreni tekrar girmen gerekiyor.' };
      } else if (error.code === 'auth/user-not-found') {
        return { success: false, error: 'Kullanıcı bulunamadı.' };
      } else if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Ağ bağlantısı hatası.' };
      } else {
        return { success: false, error: 'Hesap silinirken bir hata oluştu.' };
      }
    }
  },
};