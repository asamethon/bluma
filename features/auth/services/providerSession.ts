import { store } from '@/store';
import { notificationActions } from '@/store/notificationStore';
import { patchAuth } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getIdToken, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { upsertProviderProfile, type ProviderIdentity } from './providerProfile';
import { isOnboarded } from './sessionState';
import { writeCachedSession } from './sessionStorage';

/**
 * Sağlayıcıdan bağımsız oturum kurulumu: profil upsert + Redux + kalıcı kayıt.
 * Google/Apple/e-posta akışlarının tamamı buradan geçer.
 */
export async function establishSession(
  firebaseUser: FirebaseAuthTypes.User,
  identity: ProviderIdentity,
): Promise<void> {
  const { user, isNew } = await upsertProviderProfile(firebaseUser.uid, identity);
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

/** Push token kaydı kritik değil — giriş akışını bekletmez. */
function savePushToken(userId: string) {
  void import('@/services/pushNotificationService')
    .then(({ pushNotificationService }) => pushNotificationService.saveUserPushToken(userId))
    .catch(error => logger.debug('Push token kaydedilirken hata (non-critical):', error));
}
