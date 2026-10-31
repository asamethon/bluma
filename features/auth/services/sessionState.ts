import { challengeActions } from '@/features/challenges/services/challengeProgress';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { patchAuth, User } from '@/store/slices/authSlice';
import { presenceActions } from '@/features/privacy/services/presenceService';
import { sessionEnded, store } from '@/store';
import { logger } from '@/utils/logger';
import { clearCachedSession, writeCachedSession } from './sessionStorage';
import { sessionUser } from './sessionIdentity';

const listener = { unsubscribe: null as (() => void) | null };

export function isOnboarded(user: User | null): boolean {
  return !!(user?.username && user?.interests);
}

/**
 * Oturuma bağlı dinleyiciler ve önbellek bayrakları. Durum sıfırlanırken
 * dinleyiciler açık kalırsa eski hesabın kitaplığı/bildirimleri store'u
 * yeniden doldurur; bayraklar kalırsa aynı hesapla yeniden girişte raflar
 * "taze" sanılıp boş kalır.
 */
async function stopSessionData() {
  const [story, notifications, conversations, messaging, following, shelf] = await Promise.all([
    import('@/store/storyStore'),
    import('@/store/notificationStore'),
    import('@/store/conversationStore'),
    import('@/store/messagingStore'),
    import('@/features/story/services/discover/followingFeed'),
    import('@/features/story/services/readingProgress/shelf'),
  ]);
  story.storyActions.cleanupRealTimeListeners();
  notifications.notificationActions.cleanupNotificationsListener();
  conversations.conversationActions.cleanupListeners();
  messaging.messagingActions.stopThreadsListener();
  following.resetFollowingFeed();
  shelf.markContinueReadingStale();
}

/** Oturumu kapatır. `asGuest` true ise kullanıcı misafir olarak uygulamada kalır. */
export async function endSession({ asGuest }: { asGuest: boolean }) {
  cleanupUserListener();
  challengeActions.resetSession();
  presenceActions.stop();
  // Önce dinleyiciler kapanır, sonra durum sıfırlanır: aksi halde arada gelen
  // bir anlık görüntü eski hesabın verisini geri yazardı.
  await stopSessionData().catch(error => logger.debug('Oturum dinleyicileri kapatılamadı:', error));
  await clearCachedSession();
  store.dispatch(sessionEnded());
  store.dispatch(patchAuth({
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    isGuest: asGuest,
    user: null,
    token: null,
  }));
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
      const firebaseUser = getAuth().currentUser;
      if (!docSnap.exists() || firebaseUser?.uid !== userId) return;
      const userData = sessionUser(firebaseUser, docSnap.data()!);
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
