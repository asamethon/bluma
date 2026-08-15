import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { patchAuth, User } from '@/store/slices/authSlice';
import { resetPrivacy } from '@/store/slices/privacySlice';
import { presenceActions } from '@/features/privacy/services/presenceService';
import { store } from '@/store';
import { logger } from '@/utils/logger';
import { clearCachedSession, writeCachedSession } from './sessionStorage';

let userUnsubscribe: (() => void) | null = null;

export function isOnboarded(user: User | null): boolean {
  return !!(user?.username && user?.interests);
}

/** Oturumu kapatır. `asGuest` true ise kullanıcı misafir olarak uygulamada kalır. */
export async function endSession({ asGuest }: { asGuest: boolean }) {
  cleanupUserListener();
  presenceActions.stop();
  await clearCachedSession();
  store.dispatch(resetPrivacy());
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

    userUnsubscribe = onSnapshot(userDocRef, docSnap => {
      if (!docSnap.exists()) return;
      const userData = { id: docSnap.id, ...docSnap.data() } as User;
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
    userUnsubscribe?.();
    userUnsubscribe = null;
  } catch (error) {
    logger.error('Error cleaning up user listener:', error);
  }
}
