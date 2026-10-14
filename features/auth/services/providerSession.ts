import { store } from '@/store';
import { notificationActions } from '@/store/notificationStore';
import { patchAuth, User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getIdToken, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { migratePublicPersonalFields, withoutPersonalFields, writePrivateAccount } from './privateAccount';
import { isOnboarded } from './sessionState';
import { writeCachedSession } from './sessionStorage';
import { buildSignupContext, trackSignupContext } from './signupContext';

/** Sağlayıcıdan gelen kimlik alanları — her girişte tazelenir. */
export type ProviderIdentity = {
  email: string;
  displayName: string;
  authProvider: NonNullable<User['authProvider']>;
  appleUserId?: string;
};

/**
 * Sağlayıcıdan bağımsız oturum kurulumu: profil upsert + Redux + kalıcı kayıt.
 * Google/Apple/e-posta akışlarının tamamı buradan geçer.
 */
export async function establishSession(
  firebaseUser: FirebaseAuthTypes.User,
  identity: ProviderIdentity,
): Promise<void> {
  const { user, isNew } = await upsertProfile(firebaseUser.uid, identity);
  const token = await getIdToken(firebaseUser);
  const onboarded = isOnboarded(user);

  store.dispatch(patchAuth({
    token,
    user,
    isAuthenticated: true,
    isGuest: false,
    hasCompletedOnboarding: onboarded,
  }));

  // Çıkışta Google oturumunun da kapatılabilmesi için sağlayıcı kalıcı tutulur.
  await AsyncStorage.multiSet([['userToken', token], ['authProvider', identity.authProvider]]);
  await writeCachedSession(user, onboarded);

  if (isNew) {
    logEvent(getAnalytics(), 'sign_up', { method: identity.authProvider }).catch(() => {});
    notificationActions
      .createWelcomeNotification(user.id, user.displayName)
      .catch(error => logger.debug('Hoş geldin bildirimi gönderilemedi:', error));
  }

  savePushToken(firebaseUser.uid);
}

/**
 * Profil dokümanını oluşturur ya da kimlik alanlarını tazeler.
 * E-posta, `appleUserId` ve kayıt bağlamı herkese açık dokümana DEĞİL,
 * yalnızca sahibinin okuduğu özel dokümana yazılır (bkz. privateAccount).
 */
async function upsertProfile(
  userId: string,
  identity: ProviderIdentity,
): Promise<{ user: User; isNew: boolean }> {
  const { email, appleUserId, ...publicIdentity } = identity;
  try {
    const userDocRef = doc(getFirestore(), 'users', userId);
    const existing = (await getDoc(userDocRef)).data();

    if (!existing) {
      // Kayıt bağlamı yalnızca ilk oluşturmada yazılır.
      const signupContext = buildSignupContext();
      await writePrivateAccount(userId, { email, appleUserId, ...signupContext });
      const user = { id: userId, ...identity } as unknown as User;
      await setDoc(userDocRef, {
        id: userId,
        ...publicIdentity,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      trackSignupContext(signupContext);
      return { user, isNew: true };
    }

    await writePrivateAccount(userId, { email, appleUserId });
    await setDoc(userDocRef, { ...publicIdentity, updatedAt: serverTimestamp() }, { merge: true });
    // Eski sürümlerin sızdırdığı alanları temizler; giriş akışını bekletmez.
    void migratePublicPersonalFields(userId, existing);
    return {
      user: { ...withoutPersonalFields(existing), id: userId, ...identity } as User,
      isNew: false,
    };
  } catch (error) {
    // Firestore erişilemezse oturum düşürülmez; kimlik alanlarıyla devam edilir.
    logger.error('Profil okunamadı, kimlik bilgileriyle devam ediliyor:', error);
    return { user: { id: userId, ...identity } as User, isNew: false };
  }
}

/** Push token kaydı kritik değil — giriş akışını bekletmez. */
function savePushToken(userId: string) {
  void import('@/services/pushNotificationService')
    .then(({ pushNotificationService }) => pushNotificationService.saveUserPushToken(userId))
    .catch(error => logger.debug('Push token kaydedilirken hata (non-critical):', error));
}
