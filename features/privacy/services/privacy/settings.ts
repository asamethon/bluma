import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  getFirestore,
} from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchUser } from '@/store/slices/authSlice';
import { patchPrivacy, resetPrivacy } from '@/store/slices/privacySlice';
import { primeCachedUser } from '@/features/auth/services/userCache';
import { logger } from '@/utils/logger';
import { presenceActions } from '../presenceService';
import { PrivacySettings, privacyOf } from '../../types';

const db = () => getFirestore();

export async function load() {
  const user = store.getState().auth.user;
  if (!user?.id) {
    store.dispatch(resetPrivacy());
    return;
  }
  try {
    const snap = await getDocs(collection(db(), 'users', user.id, 'following'));
    store.dispatch(patchPrivacy({ followingIds: snap.docs.map(d => d.id), loaded: true }));
  } catch (error) {
    logger.error('Gizlilik durumu yüklenemedi:', error);
    store.dispatch(patchPrivacy({ loaded: true }));
  }
}

export function applyLocally(settings: PrivacySettings) {
  store.dispatch(patchUser({ privacy: settings }));
  const user = store.getState().auth.user;
  if (user) {
    primeCachedUser(user);
    AsyncStorage.setItem('userData', JSON.stringify(user)).catch(() => {});
  }
}

/** İyimser güncelleme: UI anında değişir, hata olursa geri alınır. */

export async function update(patch: Partial<PrivacySettings>) {
  const user = store.getState().auth.user;
  if (!user?.id) return { success: false, error: i18n.t('errors.loginRequired') };

  const previous = privacyOf(user);
  const next: PrivacySettings = { ...previous, ...patch };
  applyLocally(next);

  try {
    await setDoc(
      doc(db(), 'users', user.id),
      { privacy: next, updatedAt: serverTimestamp() },
      { merge: true }
    );
    // Etkinlik durumu kapandıysa son görülme damgası da silinir.
    if (patch.showActivity === false) presenceActions.clearLastActive(user.id);
    else if (patch.showActivity === true) presenceActions.touch(true);
    // Hesap herkese açığa döndüyse bekleyen takip istekleri otomatik onaylanır.
    if (patch.privateAccount === false && previous.privateAccount) {
      const { followRequestActions } = await import('@/features/social/services/followRequests');
      followRequestActions.approveAllPending().catch(() => {});
    }
    return { success: true };
  } catch (error) {
    logger.error('Gizlilik ayarı kaydedilemedi:', error);
    applyLocally(previous);
    return { success: false, error: i18n.t('privacy.updateFailed') };
  }
}

/** `viewerId`, `ownerId`'yi takip ediyor mu (ownerId'nin takipçisi mi). */
