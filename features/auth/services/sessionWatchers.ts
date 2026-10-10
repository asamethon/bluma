import { store } from '@/store';
import { logger } from '@/utils/logger';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { AppState } from 'react-native';
import { hydrateSession } from './sessionHydration';
import { endSession } from './sessionState';

const watchers: { auth: (() => void) | null; appState: { remove: () => void } | null } = {
  auth: null,
  appState: null,
};

/** Firebase oturum durumunu sürekli izler (idempotent). */
function watchAuthState() {
  if (watchers.auth) return;

  watchers.auth = onAuthStateChanged(getAuth(), user => {
    const state = store.getState().auth;

    if (user) {
      if (!state.isAuthenticated || state.user?.id !== user.uid) void hydrateSession(user);
      return;
    }
    if (state.isAuthenticated) {
      logger.debug('Firebase oturumu kapandı, yerel durum temizleniyor');
      void endSession({ asGuest: state.isGuest });
    }
  });
}

/**
 * Uygulama öne geldiğinde kurtarma: ilk açılışta ağ yoksa oturum kurulamamış
 * olabilir. Firebase'de kullanıcı varken Redux "çıkış yapılmış" görünüyorsa düzeltir.
 */
function watchAppState() {
  if (watchers.appState) return;

  watchers.appState = AppState.addEventListener('change', nextState => {
    if (nextState !== 'active') return;
    const currentUser = getAuth().currentUser;
    const { isAuthenticated, user } = store.getState().auth;
    if (currentUser && (!isAuthenticated || user?.id !== currentUser.uid)) {
      logger.debug('Öne gelindi, oturum yeniden kuruluyor');
      void hydrateSession(currentUser);
    }
  });
}

export function startSessionWatchers() {
  watchAuthState();
  watchAppState();
}
