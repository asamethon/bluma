import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { notificationActions } from '@/store/notificationStore';
import { logger } from '@/utils/logger';
import { db, requestRef } from './refs';

export async function approveRequest(requesterId: string) {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return { success: false, error: i18n.t('errors.loginRequired') };

  try {
    await Promise.all([
      setDoc(doc(db(), 'users', currentUser.id, 'followers', requesterId), {
        userId: requesterId,
        followedAt: serverTimestamp(),
      }),
      setDoc(doc(db(), 'users', requesterId, 'following', currentUser.id), {
        userId: currentUser.id,
        followedAt: serverTimestamp(),
      }),
    ]);

    await Promise.all([
      updateDoc(doc(db(), 'users', currentUser.id), { followersCount: increment(1) }),
      updateDoc(doc(db(), 'users', requesterId), { followingCount: increment(1) }),
    ]).catch((e: any) => logger.error('Follow counter update error:', e));

    await deleteDoc(requestRef(currentUser.id, requesterId));

    store.dispatch(patchAuth({ user: {
      ...currentUser,
      followersCount: (currentUser.followersCount || 0) + 1,
    } }));

    notificationActions
      .createFollowAcceptedNotification(currentUser.id, requesterId, currentUser.displayName)
      .catch((e: any) => logger.error('Follow accepted notification error:', e));

    return { success: true };
  } catch (error) {
    logger.error('Approve follow request error:', error);
    return { success: false, error: i18n.t('social.followFailed') };
  }
}

export async function rejectRequest(requesterId: string) {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return { success: false, error: i18n.t('errors.loginRequired') };
  try {
    await deleteDoc(requestRef(currentUser.id, requesterId));
    return { success: true };
  } catch (error) {
    logger.error('Reject follow request error:', error);
    return { success: false, error: i18n.t('social.unfollowFailed') };
  }
}

/** Hesap herkese açığa dönerse bekleyen istekler otomatik onaylanır. */

export async function approveAllPending() {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return;
  try {
    const snap = await getDocs(collection(db(), 'users', currentUser.id, 'followRequests'));
    for (const d of snap.docs) {
      await approveRequest(d.id);
    }
  } catch (error) {
    logger.error('Approve all pending requests error:', error);
  }
}
