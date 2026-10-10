import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth, User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdToken, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { endSession, isOnboarded } from './sessionState';
import { isTerminalAuthError, readCachedSession, writeCachedSession } from './sessionStorage';
import { buildSignupContext, trackSignupContext } from './signupContext';
import { primeCachedUser } from './userCache';

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
export async function hydrateSession(firebaseUser: FirebaseAuthTypes.User) {
  const cached = await readCachedSession();

  // Oturum, onboarding durumu BİLİNMEDEN açılmaz. Aksi halde giriş anında
  // hasCompletedOnboarding=false görünür ve profil gelene kadar onboarding
  // ekranı bir kaç saniyeliğine açılıp kapanırdı.
  if (cached && cached.user.id === firebaseUser.uid) {
    store.dispatch(patchAuth({
      isAuthenticated: true,
      isGuest: false,
      user: cached.user,
      hasCompletedOnboarding: cached.hasCompletedOnboarding,
    }));
  }

  // Token arka planda tazelenir; açılış akışını bloklamaz.
  void refreshIdToken(firebaseUser);
  await syncProfile(firebaseUser);
  await startSessionServices(firebaseUser.uid);
}

async function syncProfile(firebaseUser: FirebaseAuthTypes.User) {
  try {
    const userDocRef = doc(getFirestore(), 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists()
      ? ({ id: userDoc.id, ...userDoc.data() } as User)
      : await createMissingProfile(firebaseUser);

    const onboarded = isOnboarded(userData);
    store.dispatch(patchAuth({
      isAuthenticated: true,
      isGuest: false,
      user: userData,
      hasCompletedOnboarding: onboarded,
    }));
    primeCachedUser(userData);
    await writeCachedSession(userData, onboarded);
  } catch (error) {
    // Çevrimdışı / geçici Firestore hatası: önbellekteki profille devam edilir,
    // oturum ASLA düşürülmez.
    logger.debug('Profil okunamadı, önbellek kullanılıyor:', error);
    // Önbellek de yoksa oturum yine de açılır — kullanıcı boş ekranda kalmasın.
    if (!store.getState().auth.isAuthenticated) {
      store.dispatch(patchAuth({ isAuthenticated: true, isGuest: false }));
    }
  }
}

async function createMissingProfile(firebaseUser: FirebaseAuthTypes.User): Promise<User> {
  logger.debug('Firestore profili yok, oluşturuluyor');
  const signupContext = buildSignupContext();
  const userData = {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || i18n.t('common.user'),
    authProvider: providerOf(firebaseUser),
    ...signupContext,
  } as unknown as User;

  await setDoc(doc(getFirestore(), 'users', firebaseUser.uid), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  trackSignupContext(signupContext);
  return userData;
}

/** Gizlilik/takip filtreleri, son görülme damgası ve push token kaydı. */
async function startSessionServices(userId: string) {
  const [{ privacyActions }, { presenceActions }] = await Promise.all([
    import('@/features/privacy/services/privacyService'),
    import('@/features/privacy/services/presenceService'),
  ]);
  privacyActions.load().catch(() => {});
  presenceActions.start();

  try {
    const { pushNotificationService } = await import('@/services/pushNotificationService');
    await pushNotificationService.saveUserPushToken(userId);
  } catch (error) {
    logger.debug('Push token kaydedilirken hata (non-critical):', error);
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
      return;
    }
    logger.debug('Token yenilenemedi, oturum korunuyor:', error?.code ?? error);
  }
}
