import { AppState } from 'react-native';
import {
  deleteField,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { store } from '@/store';
import { logger } from '@/utils/logger';
import { privacyOf } from '../types';

// Kalp atışı aralığı ve "çevrimiçi" sayılma penceresi (pencere > aralık olmalı).
const HEARTBEAT_MS = 5 * 60 * 1000;
export const ONLINE_WINDOW_MS = 6 * 60 * 1000;

let lastWriteAt = 0;
let appStateSubscription: { remove: () => void } | null = null;

/** Son görülme damgasını tazeler; etkinlik durumu kapalıysa hiçbir şey yazmaz. */
async function touch(force = false) {
  const user = store.getState().auth.user;
  if (!user?.id || !privacyOf(user).showActivity) return;

  const now = Date.now();
  if (!force && now - lastWriteAt < HEARTBEAT_MS) return;
  lastWriteAt = now;

  try {
    await setDoc(
      doc(getFirestore(), 'users', user.id),
      { lastActiveAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    lastWriteAt = 0;
    logger.debug('Son görülme yazılamadı:', error);
  }
}

/** Etkinlik durumu kapatıldığında damga tamamen silinir. */
async function clearLastActive(userId: string) {
  lastWriteAt = 0;
  try {
    await setDoc(doc(getFirestore(), 'users', userId), { lastActiveAt: deleteField() }, { merge: true });
  } catch (error) {
    logger.debug('Son görülme silinemedi:', error);
  }
}

/** Uygulama öne geldikçe damgayı tazeler (idempotent). */
function start() {
  touch(true);
  if (appStateSubscription) return;
  appStateSubscription = AppState.addEventListener('change', next => {
    if (next === 'active') touch();
  });
}

function stop() {
  appStateSubscription?.remove();
  appStateSubscription = null;
  lastWriteAt = 0;
}

export const presenceActions = { touch, clearLastActive, start, stop };
