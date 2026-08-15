import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchUser } from '@/store/slices/authSlice';
import { patchPrivacy, resetPrivacy } from '@/store/slices/privacySlice';
import { primeCachedUser, getUserById } from '@/features/auth/services/userCache';
import { logger } from '@/utils/logger';
import { presenceActions } from './presenceService';
import { DEFAULT_PRIVACY, PrivacySettings, privacyOf } from '../types';

const db = () => getFirestore();

/** Kendi tercihlerimi ve takip listemi store'a yükler (idempotent). */
async function load() {
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

function applyLocally(settings: PrivacySettings) {
  store.dispatch(patchUser({ privacy: settings }));
  const user = store.getState().auth.user;
  if (user) {
    primeCachedUser(user);
    AsyncStorage.setItem('userData', JSON.stringify(user)).catch(() => {});
  }
}

/** İyimser güncelleme: UI anında değişir, hata olursa geri alınır. */
async function update(patch: Partial<PrivacySettings>) {
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
async function isFollowerOf(ownerId: string, viewerId: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db(), 'users', ownerId, 'followers', viewerId));
    return snap.exists();
  } catch (error) {
    logger.error('Takipçi kontrolü başarısız:', error);
    return false;
  }
}

/** Gizli hesabın profili/içerikleri yalnızca takipçilerine (ve sahibine) açıktır. */
async function canViewProfile(targetUserId: string): Promise<boolean> {
  const myId = store.getState().auth.user?.id;
  if (!targetUserId) return false;
  if (targetUserId === myId) return true;

  const target = await getUserById(targetUserId);
  if (!privacyOf(target).privateAccount) return true;
  if (!myId) return false;
  return isFollowerOf(targetUserId, myId);
}

/**
 * Alıcı "herkes mesaj gönderebilsin"i kapattıysa yalnızca KENDİ takip ettiği
 * kişiler yazabilir (kurallarda da aynısı zorlanır).
 */
async function canSendMessageTo(targetUserId: string): Promise<boolean> {
  const myId = store.getState().auth.user?.id;
  if (!myId || !targetUserId) return false;
  if (myId === targetUserId) return true;

  const target = await getUserById(targetUserId);
  if (privacyOf(target).allowMessages) return true;

  try {
    const snap = await getDoc(doc(db(), 'users', targetUserId, 'following', myId));
    return snap.exists();
  } catch (error) {
    logger.error('Mesaj izni kontrolü başarısız:', error);
    return false;
  }
}

/** "Aramada göster" kapalı hesaplar arama/öneri listelerinden düşer. */
function filterDiscoverable<T extends { id: string; privacy?: any }>(users: T[]): T[] {
  const myId = store.getState().auth.user?.id;
  return users.filter(u => u.id === myId || privacyOf(u).discoverable);
}

/** Gizli hesapların içeriği, takipçi olmayanların akış/arama listelerinden düşer. */
function filterPrivateContent<T extends { authorId?: string; author?: any }>(
  items: T[],
  followingIds?: string[]
): T[] {
  const state = store.getState();
  const myId = state.auth.user?.id;
  const following = followingIds ?? state.privacy.followingIds;
  return items.filter(item => {
    const authorId = item.authorId ?? item.author?.id;
    if (!authorId || authorId === myId) return true;
    if (!privacyOf(item.author).privateAccount) return true;
    return following.includes(authorId);
  });
}

export const privacyActions = {
  load,
  update,
  isFollowerOf,
  canViewProfile,
  canSendMessageTo,
  filterDiscoverable,
  filterPrivateContent,
  DEFAULT_PRIVACY,
};
