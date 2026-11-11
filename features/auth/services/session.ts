import { store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import { hydrateSession } from './sessionHydration';
import { cleanupUserListener, endSession, setupUserListener } from './sessionState';
import { readCachedSession, restoreFirebaseUser } from './sessionStorage';
import { startSessionWatchers } from './sessionWatchers';
import { continueAsGuest, signOut } from './signOutFlow';

/**
 * Native katman cevap vermediğinde oturum kararı için tanınan ek süre.
 * Dolduğunda "oturum yok" kabul edilir — süresiz spinner olmaz.
 */
const UNRESOLVED_GRACE_MS = 2000;

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
          sessionResolved: true,
          isAuthenticated: true,
          isGuest: false,
          user: cached.user,
          hasCompletedOnboarding: cached.hasCompletedOnboarding,
        }));
        return;
      }
      // Önbellek de yok: BİLMİYORUZ. `sessionResolved` false kalır, giriş ekranı
      // kullanıcıyı karşılamaya göndermez; kararı dinleyici verir (ya da süre).
      waitForWatcherVerdict();
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
    // Hata oturum sorusunu cevapsız bırakır; dinleyici de susarsa kullanıcı
    // boş ekranda kalmasın diye aynı süre sınırı burada da kurulur.
    waitForWatcherVerdict();
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
    startSessionWatchers();
  }
}

/** Dinleyici de susarsa kullanıcı spinner'da kalmasın. */
function waitForWatcherVerdict() {
  setTimeout(() => {
    if (store.getState().auth.sessionResolved) return;
    logger.debug('Oturum kararı gelmedi, oturum yok kabul ediliyor');
    store.dispatch(patchAuth({ sessionResolved: true }));
  }, UNRESOLVED_GRACE_MS);
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
