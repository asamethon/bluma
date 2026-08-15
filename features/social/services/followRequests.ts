import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { notificationActions } from '@/store/notificationStore';
import { logger } from '@/utils/logger';

const db = () => getFirestore();

// Gizli hesaba takip isteği: users/{hedef}/followRequests/{isteyen}
const requestRef = (ownerId: string, requesterId: string) =>
  doc(db(), 'users', ownerId, 'followRequests', requesterId);

export type FollowRequest = { id: string; createdAt?: any };

async function sendFollowRequest(targetUserId: string) {
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

async function cancelFollowRequest(targetUserId: string) {
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

async function hasPendingRequest(targetUserId: string): Promise<boolean> {
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
function listenPendingRequests(ownerId: string, cb: (requests: FollowRequest[]) => void) {
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
async function approveRequest(requesterId: string) {
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

async function rejectRequest(requesterId: string) {
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
async function approveAllPending() {
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

export const followRequestActions = {
  sendFollowRequest,
  cancelFollowRequest,
  hasPendingRequest,
  listenPendingRequests,
  approveRequest,
  rejectRequest,
  approveAllPending,
};
