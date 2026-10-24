import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { patchAuth, User } from '@/store/slices/authSlice';
import { resetPrivacy } from '@/store/slices/privacySlice';
import { presenceActions } from '@/features/privacy/services/presenceService';
import { store } from '@/store';
import { resetStoryDrafts } from '@/store/slices/storyDraftSlice';
import { logger } from '@/utils/logger';
import { clearCachedSession, writeCachedSession } from './sessionStorage';
import { sessionUser } from './sessionIdentity';

const listener = { unsubscribe: null as (() => void) | null };

export function isOnboarded(user: User | null): boolean {
  return !!(user?.username && user?.interests);
}

/** Oturumu kapatır. `asGuest` true ise kullanıcı misafir olarak uygulamada kalır. */
export async function endSession({ asGuest }: { asGuest: boolean }) {
  cleanupUserListener();
  presenceActions.stop();
  await clearCachedSession();
  store.dispatch(resetPrivacy());
  store.dispatch(resetStoryDrafts());
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
