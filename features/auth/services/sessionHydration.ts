import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth, patchUser, User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdToken, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import {
  hydrateUserDoc,
  migratePublicPersonalFields,
  readPrivateAccount,
  writePrivateAccount,
} from './privateAccount';
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
  const cachedMatches = cached?.user.id === firebaseUser.uid;

  // Oturum, onboarding durumu BİLİNMEDEN açılmaz. Aksi halde giriş anında
  // hasCompletedOnboarding=false görünür ve profil gelene kadar onboarding
  // ekranı bir kaç saniyeliğine açılıp kapanırdı.
  if (cached && cachedMatches) {
    store.dispatch(patchAuth({
      isAuthenticated: true,
      isGuest: false,
      user: cached.user,
      hasCompletedOnboarding: cached.hasCompletedOnboarding,
    }));
  }

  // Token arka planda tazelenir; açılış akışını bloklamaz.
  void refreshIdToken(firebaseUser);
  // Kayıtlı oturumla ekran hemen açılır; Firestore profili gelince yenilenir.
  if (cachedMatches) void syncProfile(firebaseUser);
  else await syncProfile(firebaseUser);
  // Push token ve yardımcı servisler ağ bekleyebilir; açılışı geciktirmez.
  void startSessionServices(firebaseUser.uid)
    .catch(error => logger.debug('Oturum servisleri başlatılamadı:', error));
  void hydrateAppleUserId(firebaseUser)
    .catch(error => logger.debug('appleUserId okunamadı:', error));
}

async function syncProfile(firebaseUser: FirebaseAuthTypes.User) {
  try {
    const userDocRef = doc(getFirestore(), 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const publicData = userDoc.data();
    // Kişisel alanlar herkese açık dokümanda tutulmaz; e-posta Auth'tan gelir.
    const userData = publicData
      ? hydrateUserDoc(userDoc.id, publicData, store.getState().auth.user)
      : await createMissingProfile(firebaseUser);
    if (publicData) void migratePublicPersonalFields(firebaseUser.uid, publicData);

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
  const email = firebaseUser.email || '';
  const publicData = {
    id: firebaseUser.uid,
    displayName: firebaseUser.displayName || i18n.t('common.user'),
    authProvider: providerOf(firebaseUser),
  };

  // Kişisel veri (e-posta, cihaz/bölge) herkese açık dokümana yazılmaz.
  await writePrivateAccount(firebaseUser.uid, { email, ...signupContext });
  await setDoc(doc(getFirestore(), 'users', firebaseUser.uid), {
    ...publicData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  trackSignupContext(signupContext);
  return { ...publicData, email } as unknown as User;
}

/**
 * Apple yeniden kimlik doğrulaması `appleUserId`'ye muhtaçtır ve bu alan
 * artık herkese açık dokümanda değil, özel dokümanda durur.
 */
async function hydrateAppleUserId(firebaseUser: FirebaseAuthTypes.User) {
  if (providerOf(firebaseUser) !== 'apple') return;
  if (store.getState().auth.user?.appleUserId) return;
  const privateAccount = await readPrivateAccount(firebaseUser.uid);
  if (privateAccount?.appleUserId) {
    store.dispatch(patchUser({ appleUserId: privateAccount.appleUserId }));
  }
}

/** Gizlilik/takip filtreleri, son görülme damgası ve push token kaydı. */
async function startSessionServices(userId: string) {
  const [{ privacyActions }, { presenceActions }] = await Promise.all([
    import('@/features/privacy/services/privacyService'),
    import('@/features/privacy/services/presenceService'),
  ]);
  privacyActions.load().catch(() => {});
  presenceActions.start();
  // Görev ilerlemesi ve seri (streak) oturum açılışında yüklenir: eskiden
  // yalnızca profil ekranı yüklüyordu, bu yüzden profil açılmadan yapılan
  // okuma/yorum/takip boş haritadan hesaplanıp ilerlemeyi siliyordu ve seri
  // "profil sekmesini açtığın gün" ile işliyordu.
  const { challengeActions } = await import('@/store/challengeStore');
  challengeActions.loadProgress(userId).catch(() => {});

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
