import { store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import { hydrateSession } from './sessionHydration';
import { cleanupUserListener, endSession, setupUserListener } from './sessionState';
import { readCachedSession, restoreFirebaseUser } from './sessionStorage';
import { startSessionWatchers } from './sessionWatchers';
import { continueAsGuest, signOut } from './signOutFlow';

async function initializeAuth() {
  store.dispatch(patchAuth({ isLoading: true }));
  try {
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

    await hydrateSession(firebaseUser);
  } catch (error) {
    logger.error('Auth başlatılırken kritik hata:', error);
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
    startSessionWatchers();
  }
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
