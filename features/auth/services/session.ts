import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuth,
  onAuthStateChanged,
  getIdToken,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { AppState } from 'react-native';
import { patchAuth, User } from '@/store/slices/authSlice';
import { store } from '@/store';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import { primeCachedUser } from './userCache';
import { buildSignupContext, trackSignupContext } from './signupContext';
import { cleanupUserListener, endSession, isOnboarded, setupUserListener } from './sessionState';
import { continueAsGuest, signOut } from './signOutFlow';
import {
  isTerminalAuthError,
  readCachedSession,
  restoreFirebaseUser,
  writeCachedSession,
} from './sessionStorage';

let authStateUnsubscribe: (() => void) | null = null;
let appStateSubscription: { remove: () => void } | null = null;

function providerOf(firebaseUser: FirebaseAuthTypes.User): User['authProvider'] {
  const providerId = firebaseUser.providerData[0]?.providerId ?? '';
  if (providerId.includes('apple')) return 'apple';
  if (providerId.includes('google')) return 'google';
  return 'email';
}

/**
 * Oturumu Redux'a yazar. Kritik nokta: oturumun varlığı ID token'a DEĞİL,
 * Firebase kullanıcısının varlığına bağlıdır — token yenilemek ağ ister ve
 * başarısız olması "çıkış yapıldı" anlamına gelmez.
 */
async function hydrateSession(firebaseUser: FirebaseAuthTypes.User) {
  const cached = await readCachedSession();

  store.dispatch(patchAuth({ isAuthenticated: true, isGuest: false }));
  if (cached && cached.user.id === firebaseUser.uid) {
    store.dispatch(patchAuth({
      user: cached.user,
      hasCompletedOnboarding: cached.hasCompletedOnboarding,
    }));
  }

  // Token arka planda tazelenir; açılış akışını bloklamaz.
  refreshIdToken(firebaseUser);

  try {
    const userDocRef = doc(getFirestore(), 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    let userData: User;

    if (userDoc.exists()) {
      userData = { id: userDoc.id, ...userDoc.data() } as User;
    } else {
      logger.debug('Firestore profili yok, oluşturuluyor');
      const signupContext = buildSignupContext();
      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || i18n.t('common.user'),
        authProvider: providerOf(firebaseUser),
        ...signupContext,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, userData);
      trackSignupContext(signupContext);
    }

    const onboarded = isOnboarded(userData);
    store.dispatch(patchAuth({ user: userData, hasCompletedOnboarding: onboarded }));
    primeCachedUser(userData);
    await writeCachedSession(userData, onboarded);
  } catch (firestoreError) {
    // Çevrimdışı / geçici Firestore hatası: önbellekteki profille devam edilir,
    // oturum ASLA düşürülmez.
    logger.debug('Profil okunamadı, önbellek kullanılıyor:', firestoreError);
  }

  // Gizlilik tercihleri + takip listesi (akış filtreleri) ve son görülme damgası.
  const { privacyActions } = await import('@/features/privacy/services/privacyService');
  const { presenceActions } = await import('@/features/privacy/services/presenceService');
  privacyActions.load().catch(() => {});
  presenceActions.start();

  try {
    const { pushNotificationService } = await import('@/services/pushNotificationService');
    await pushNotificationService.saveUserPushToken(firebaseUser.uid);
  } catch (pushError) {
    logger.debug('Push token kaydedilirken hata (non-critical):', pushError);
  }
}

async function refreshIdToken(firebaseUser: FirebaseAuthTypes.User) {
  try {
    const token = await getIdToken(firebaseUser);
    store.dispatch(patchAuth({ token }));
    await AsyncStorage.setItem('userToken', token);
  } catch (error: any) {
    if (isTerminalAuthError(error)) {
      logger.debug('Oturum gerçekten geçersiz, temizleniyor:', error.code);
      await endSession({ asGuest: false });
    } else {
      logger.debug('Token yenilenemedi, oturum korunuyor:', error?.code ?? error);
    }
  }
}

async function initializeAuth() {
  try {
    logger.debug('Auth başlatılıyor...');
    store.dispatch(patchAuth({ isLoading: true }));

    const firebaseUser = await restoreFirebaseUser();

    if (firebaseUser === undefined) {
      // Native katman zamanında cevap vermedi: son bilinen oturumla devam edilir,
      // gerçek durumu kalıcı dinleyici birazdan bildirir.
      const cached = await readCachedSession();
      logger.debug('Auth geri yükleme zaman aşımı, önbellek:', cached ? cached.user.id : 'yok');
      if (cached) {
        store.dispatch(patchAuth({
          isAuthenticated: true,
          isGuest: false,
          user: cached.user,
          hasCompletedOnboarding: cached.hasCompletedOnboarding,
        }));
      }
      return;
    }

    if (!firebaseUser) {
      logger.debug('Firebase oturumu yok');
      await endSession({ asGuest: false });
      return;
    }

    logger.debug('Firebase oturumu geri yüklendi:', firebaseUser.uid);
    await hydrateSession(firebaseUser);
  } catch (error) {
    logger.error('Auth başlatılırken kritik hata:', error);
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
    watchAuthState();
    watchAppState();
  }
}

/** Firebase oturum durumunu sürekli izler (idempotent). */
function watchAuthState() {
  if (authStateUnsubscribe) return;

  authStateUnsubscribe = onAuthStateChanged(getAuth(), user => {
    const state = store.getState().auth;

    if (user) {
      if (!state.isAuthenticated || state.user?.id !== user.uid) hydrateSession(user);
      return;
    }

    if (state.isAuthenticated) {
      logger.debug('Firebase oturumu kapandı, yerel durum temizleniyor');
      endSession({ asGuest: state.isGuest });
    }
  });
}

/**
 * Uygulama öne geldiğinde kurtarma: ilk açılışta ağ yoksa oturum kurulamamış
 * olabilir. Firebase'de kullanıcı varken Redux "çıkış yapılmış" görünüyorsa düzeltir.
 */
function watchAppState() {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener('change', nextState => {
    if (nextState !== 'active') return;
    const currentUser = getAuth().currentUser;
    const { isAuthenticated, user } = store.getState().auth;
    if (currentUser && (!isAuthenticated || user?.id !== currentUser.uid)) {
      logger.debug('Öne gelindi, oturum yeniden kuruluyor');
      hydrateSession(currentUser);
    }
  });
}

function isFullyAuthenticated(): boolean {
  const state = store.getState().auth;
  return state.isAuthenticated && state.hasCompletedOnboarding;
}

export const sessionActions = {
  initializeAuth,
  signOut,
  continueAsGuest,
  isFullyAuthenticated,
  setupUserListener,
  cleanupUserListener,
};
