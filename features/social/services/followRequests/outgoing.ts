import {
  collection,
  deleteDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { store } from '@/store';
import { notificationActions } from '@/store/notificationStore';
import { logger } from '@/utils/logger';
import { db, requestRef } from './refs';
import type { FollowRequest } from './refs';

export async function sendFollowRequest(targetUserId: string) {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return { success: false, error: i18n.t('errors.loginRequired') };
  try {
    await setDoc(requestRef(targetUserId, currentUser.id), {
      userId: currentUser.id,
      createdAt: serverTimestamp(),
    });
    notificationActions
      .createFollowRequestNotification(currentUser.id, targetUserId, currentUser.displayName)
      .catch((e: any) => logger.error('Follow request notification error:', e));
    return { success: true };
  } catch (error) {
    logger.error('Send follow request error:', error);
    return { success: false, error: i18n.t('social.followFailed') };
  }
}

export async function cancelFollowRequest(targetUserId: string) {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return { success: false, error: i18n.t('errors.loginRequired') };
  try {
    await deleteDoc(requestRef(targetUserId, currentUser.id));
    return { success: true };
  } catch (error) {
    logger.error('Cancel follow request error:', error);
    return { success: false, error: i18n.t('social.unfollowFailed') };
  }
}

export async function hasPendingRequest(targetUserId: string): Promise<boolean> {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return false;
  try {
    const snap = await getDoc(requestRef(targetUserId, currentUser.id));
    return snap.exists();
  } catch (error) {
    logger.debug('Pending request check failed:', error);
    return false;
  }
}

/** Bana gelen bekleyen istekler (idempotent dinleyici). */

export function listenPendingRequests(ownerId: string, cb: (requests: FollowRequest[]) => void) {
  return onSnapshot(
    collection(db(), 'users', ownerId, 'followRequests'),
    snap => cb(snap ? snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) : []),
    () => cb([])
  );
}

/**
 * İsteği onaylar. Sıra önemli: kurallar takip dokümanlarını yazma iznini
 * "istek hâlâ duruyor mu" koşuluna bağlar — istek EN SON silinir.
 */
