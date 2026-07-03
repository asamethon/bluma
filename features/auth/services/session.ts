import { signOutFromGoogle } from '@/config/googleSignIn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, getIdToken } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from '@react-native-firebase/firestore';
import { authState$, User } from '../../../store/authStore';

// User real-time listener için unsubscribe fonksiyonu
let userUnsubscribe: (() => void) | null = null;

// Initialize auth state from AsyncStorage
async function initializeAuth() {
  try {
    console.log('Starting auth initialization...');

    authState$.isLoading.set(true);
    authState$.isAuthenticated.set(false);
    authState$.hasCompletedOnboarding.set(false);
    authState$.user.set(null);
    authState$.token.set(null);

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
          authState$.token.set(token);
          authState$.isAuthenticated.set(true);
          authState$.isGuest.set(false);

          // Try to get user data from Firestore (optional)
          try {
            const userDocRef = doc(getFirestore(), 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);

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
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };

                await setDoc(userDocRef, newUser);
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
}

// Sign out
async function signOut() {
  try {
    // Set loading to true during sign out
    authState$.isLoading.set(true);

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
}

function continueAsGuest() {
  authState$.isGuest.set(true);
  authState$.isAuthenticated.set(false);
  authState$.hasCompletedOnboarding.set(false);
  authState$.isLoading.set(false);
}

// Check if user is fully authenticated (signed in + onboarded)
function isFullyAuthenticated(): boolean {
  const state = authState$.get();
  return state.isAuthenticated && state.hasCompletedOnboarding;
}

// User real-time listener
function setupUserListener(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      console.log('Invalid userId for user listener');
      return;
    }

    const db = getFirestore();
    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
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
