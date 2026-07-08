import { signOutFromGoogle } from '@/config/googleSignIn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, getIdToken } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from '@react-native-firebase/firestore';
import { patchAuth, User } from '@/store/slices/authSlice';
import { store } from '@/store';

// User real-time listener için unsubscribe fonksiyonu
let userUnsubscribe: (() => void) | null = null;

// Initialize auth state from AsyncStorage
async function initializeAuth() {
  try {
    console.log('Starting auth initialization...');

    store.dispatch(patchAuth({ isLoading: true }));
    store.dispatch(patchAuth({ isAuthenticated: false }));
    store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
    store.dispatch(patchAuth({ user: null }));
    store.dispatch(patchAuth({ token: null }));

    try {
      // Wait for Firebase to restore auth state from persistence
      const currentUser = await new Promise<any>((resolve) => {
        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
          unsubscribe();
          resolve(user);
        });
      });
      console.log('Firebase auth restored:', currentUser ? currentUser.uid : 'none');

      if (currentUser) {
        try {
          // User is signed in to Firebase
          const token = await getIdToken(currentUser);
          console.log('Got Firebase token');

          // Update state
          store.dispatch(patchAuth({ token: token }));
          store.dispatch(patchAuth({ isAuthenticated: true }));
          store.dispatch(patchAuth({ isGuest: false }));

          // Try to get user data from Firestore (optional)
          try {
            const userDocRef = doc(getFirestore(), 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              store.dispatch(patchAuth({ user: userData }));

              if (userData.username && userData.interests) {
                store.dispatch(patchAuth({ hasCompletedOnboarding: true }));
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
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };

                await setDoc(userDocRef, newUser);
                store.dispatch(patchAuth({ user: newUser }));
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
          } catch (firestoreError) {
            console.log('Firestore error (non-critical):', firestoreError);
            // Don't fail auth if Firestore is not accessible
          }

          console.log('Firebase auth initialization successful');
        } catch (firebaseError: any) {
          // 'no-current-user': onAuthStateChanged bazen native oturum
          // temizlendikten hemen sonra hâlâ eski (stale) bir user objesiyle
          // tetiklenebiliyor — getIdToken() o anda "oturum yok" hatası verir.
          // Bu gerçek bir hata değil, kullanıcı zaten çıkış yapmış demektir,
          // bu yüzden bu iki bilinen kod için console.error yerine console.log.
          const isBenign = firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/no-current-user';
          if (isBenign) console.log('Firebase user not found / no current user:', firebaseError.code);
          else console.error('Error with Firebase user:', firebaseError);

          if (isBenign) {
            console.log('Clearing local data');
            // Clear any stale local data and sign out
            try {
              await firebaseSignOut(getAuth());
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
            store.dispatch(patchAuth({
              isLoading: false,
              isAuthenticated: false,
              hasCompletedOnboarding: false,
              isGuest: false,
              user: null,
              token: null,
            }));
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
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

// Sign out
async function signOut() {
  try {
    // Set loading to true during sign out
    store.dispatch(patchAuth({ isLoading: true }));

    // Bir sonraki kullanıcı bu cihazda önceki kullanıcının okuma ilerlemesini
    // görmesin diye çıkıştan önce temizle (uid hâlâ state'te iken).
    const signingOutUserId = store.getState().auth.user?.id;
    if (signingOutUserId) {
      const { readingProgressActions } = await import('@/features/story/services/readingProgress');
      await readingProgressActions.clearReadingProgressCache(signingOutUserId);
    }

    // Kullanıcı doküman dinleyicisini kapat — profil ekranında kurulmuş
    // olabilir; açık kalırsa yerel cache'den gelecek bir sonraki snapshot
    // user'ı geri doldurup misafir moduna geçişi bozar.
    cleanupUserListener();

    // Sign out from Firebase
    await firebaseSignOut(getAuth());

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

    // Reset state — çıkış sonrası misafir moduna düşer (app genelinde
    // "oturum yok" tek karşılığı isGuest:true; false bırakılırsa profil/ana
    // sayfa/kütüphane gibi isGuest'e bakan ekranlar ne "misafir" ne "giriş
    // yapılmış" durumunu karşılamadığından bozuk/asılı kalıyordu).
    store.dispatch(patchAuth({ isAuthenticated: false }));
    store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
    store.dispatch(patchAuth({ isGuest: true }));
    store.dispatch(patchAuth({ user: null }));
    store.dispatch(patchAuth({ token: null }));
    store.dispatch(patchAuth({ isLoading: false }));

    console.log('Sign out successful');
  } catch (error) {
    console.error('Sign out error:', error);
    // Ensure loading is set to false even on error
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

function continueAsGuest() {
  store.dispatch(patchAuth({ isGuest: true }));
  store.dispatch(patchAuth({ isAuthenticated: false }));
  store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
  store.dispatch(patchAuth({ isLoading: false }));
}

// Check if user is fully authenticated (signed in + onboarded)
function isFullyAuthenticated(): boolean {
  const state = store.getState().auth;
  return state.isAuthenticated && state.hasCompletedOnboarding;
}

// User real-time listener
function setupUserListener(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      console.log('Invalid userId for user listener');
      return;
    }

    // Idempotent olmalı: profil ekranı her focus'ta bunu yeniden çağırıyor
    // (useFocusEffect). Önceki dinleyici kapatılmadan üzerine yazılırsa
    // eskisi arka planda sızdırılmış olarak yaşamaya devam ediyor; sign
    // out sonrası bu sızmış dinleyici, Firestore'un yerel cache'inden
    // gelen eski (silinmemiş) kullanıcı verisiyle tetiklenip user'ı
    // patchAuth ile geri dolduruyor ve misafir moduna geçişi bozuyordu.
    cleanupUserListener();

    const db = getFirestore();
    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        store.dispatch(patchAuth({ user: userData }));
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
    userUnsubscribe = unsubscribe;
  } catch (error) {
    console.error('Error setting up user listener:', error);
  }
}

// Cleanup user listener
function cleanupUserListener() {
  try {
    if (userUnsubscribe) {
      userUnsubscribe();
      userUnsubscribe = null;
    }
  } catch (error) {
    console.error('Error cleaning up user listener:', error);
  }
}

export const sessionActions = {
  initializeAuth,
  signOut,
  continueAsGuest,
  isFullyAuthenticated,
  setupUserListener,
  cleanupUserListener,
};
