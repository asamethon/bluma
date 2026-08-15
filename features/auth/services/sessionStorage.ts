import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';

const SESSION_KEYS = ['userToken', 'userData', 'authProvider', 'hasCompletedOnboarding'];

/**
 * Oturumun GERÇEKTEN geçersiz olduğunu gösteren hata kodları.
 * Bunların dışındaki her şey (özellikle ağ hataları) geçicidir ve
 * kullanıcıyı ASLA logout etmemelidir.
 */
const TERMINAL_AUTH_ERRORS = new Set([
  'auth/user-not-found',
  'auth/no-current-user',
  'auth/user-disabled',
  'auth/user-token-expired',
  'auth/invalid-user-token',
  'auth/session-expired',
  'auth/requires-recent-login',
]);

export function isTerminalAuthError(error: any): boolean {
  return TERMINAL_AUTH_ERRORS.has(error?.code);
}

/**
 * Native katman keychain/SharedPreferences'tan oturumu geri yükleyene kadar bekler.
 * `undefined` = "henüz bilinmiyor" (zaman aşımı) — bu durumda oturum düşürülmez,
 * kalıcı dinleyici gerçeği sonradan bildirir.
 */
export function restoreFirebaseUser(
  timeoutMs = 5000,
): Promise<FirebaseAuthTypes.User | null | undefined> {
  const auth = getAuth();
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise(resolve => {
    let settled = false;
    let unsubscribe: (() => void) | null = null;

    const detach = () => {
      unsubscribe?.();
      unsubscribe = null;
    };

    const finish = (value: FirebaseAuthTypes.User | null | undefined) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => { finish(undefined); detach(); }, timeoutMs);
    // Dinleyici senkron tetiklenebilir; bu yüzden detach atamadan sonra çağrılır.
    unsubscribe = onAuthStateChanged(auth, user => { finish(user); detach(); });
    if (settled) detach();
  });
}

export interface CachedSession {
  user: User;
  hasCompletedOnboarding: boolean;
}

/** Son bilinen profil anlık görüntüsü — Firestore çevrimdışıyken yedek kaynak. */
export async function readCachedSession(): Promise<CachedSession | null> {
  try {
    const entries = await AsyncStorage.multiGet(['userData', 'hasCompletedOnboarding']);
    const raw = entries.find(([key]) => key === 'userData')?.[1];
    if (!raw) return null;

    const user = JSON.parse(raw) as User;
    if (!user?.id) return null;

    const onboarding = entries.find(([key]) => key === 'hasCompletedOnboarding')?.[1];
    return { user, hasCompletedOnboarding: onboarding === 'true' };
  } catch (error) {
    logger.debug('Önbellekteki oturum okunamadı:', error);
    return null;
  }
}

export async function writeCachedSession(user: User, hasCompletedOnboarding: boolean) {
  try {
    await AsyncStorage.multiSet([
      ['userData', JSON.stringify(user)],
      ['hasCompletedOnboarding', hasCompletedOnboarding ? 'true' : 'false'],
    ]);
  } catch (error) {
    logger.debug('Oturum önbelleğe yazılamadı:', error);
  }
}

export async function clearCachedSession() {
  try {
    await AsyncStorage.multiRemove(SESSION_KEYS);
  } catch (error) {
    logger.debug('Oturum önbelleği temizlenemedi:', error);
  }
}
