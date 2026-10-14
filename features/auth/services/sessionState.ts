import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { patchAuth, User } from '@/store/slices/authSlice';
import { presenceActions } from '@/features/privacy/services/presenceService';
import { SESSION_RESET, store } from '@/store';
import { logger } from '@/utils/logger';
import { hydrateUserDoc } from './privateAccount';
import { clearCachedSession, writeCachedSession } from './sessionStorage';

const listener = { unsubscribe: null as (() => void) | null };

export function isOnboarded(user: User | null): boolean {
  return !!(user?.username && user?.interests);
}

/**
 * Oturuma bağlı Firestore dinleyicileri. Durum sıfırlanırken bunlar
 * kapanmazsa eski hesabın kitaplığı/bildirimleri store'u yeniden doldurur.
 */
async function stopSessionListeners() {
  const [{ listenersActions }, { notificationActions }, { conversationActions }] = await Promise.all([
    import('@/features/story/services/listeners'),
    import('@/store/notificationStore'),
    import('@/store/conversationStore'),
  ]);
  listenersActions.cleanupRealTimeListeners();
  notificationActions.cleanupNotificationsListener();
  conversationActions.cleanupListeners();
}

/** Oturumu kapatır. `asGuest` true ise kullanıcı misafir olarak uygulamada kalır. */
export async function endSession({ asGuest }: { asGuest: boolean }) {
  cleanupUserListener();
  presenceActions.stop();
  await stopSessionListeners().catch(error => logger.debug('Dinleyiciler kapatılamadı:', error));
  await clearCachedSession();
  // Kullanıcıya bağlı tüm dilimler sıfırlanır (bkz. SESSION_RESET): görev
  // ilerlemesi, kitaplık, okuma listeleri ve mesajlar bir sonraki hesaba
  // taşınmasın.
  store.dispatch({ type: SESSION_RESET });
  store.dispatch(patchAuth({ isGuest: asGuest, isLoading: false }));
}

export function setupUserListener(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      logger.debug('Invalid userId for user listener');
      return;
    }

    cleanupUserListener();

    const userDocRef = doc(getFirestore(), 'users', userId);

    listener.unsubscribe = onSnapshot(userDocRef, docSnap => {
      if (!docSnap.exists()) return;
      // Herkese açık doküman e-postayı/appleUserId'yi içermez; oturumdaki
      // kişisel alanlar korunur (bkz. privateAccount).
      const userData = hydrateUserDoc(docSnap.id, docSnap.data()!, store.getState().auth.user);
      const onboarded = isOnboarded(userData);
      store.dispatch(patchAuth({ user: userData, hasCompletedOnboarding: onboarded }));
      writeCachedSession(userData, onboarded);
    }, (error: any) => {
      logger.error('User listener error:', error);
      if (error.code === 'firestore/permission-denied') {
        logger.debug('User listener: Firestore permission denied, continuing without real-time updates');
      }
    });
  } catch (error) {
    logger.error('Error setting up user listener:', error);
  }
}

export function cleanupUserListener() {
  try {
    listener.unsubscribe?.();
    listener.unsubscribe = null;
  } catch (error) {
    logger.error('Error cleaning up user listener:', error);
  }
}
