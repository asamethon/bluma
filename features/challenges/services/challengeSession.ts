import { store } from '@/store';
import { AppState } from 'react-native';
import { challengeActions } from './challengeProgress';

const watcher = { unsubscribe: null as (() => void) | null };
/** Profil ekranından bağımsız, oturum ve uygulamaya dönüş aboneliği. */
export function startChallengeSession() {
  if (watcher.unsubscribe) return;
  const identity = { userId: null as string | null };
  const sync = () => {
    const auth = store.getState().auth;
    const userId = auth.isAuthenticated && !auth.isGuest ? auth.user?.id ?? null : null;
    if (identity.userId === userId) return;
    identity.userId = userId;
    challengeActions.resetSession();
    if (userId) void challengeActions.loadProgress(userId);
  };
  const unsubscribe = store.subscribe(sync);
  const appState = AppState.addEventListener('change', state => {
    if (state === 'active' && identity.userId) void challengeActions.loadProgress(identity.userId);
  });
  watcher.unsubscribe = () => { unsubscribe(); appState.remove(); };
  sync();
}
