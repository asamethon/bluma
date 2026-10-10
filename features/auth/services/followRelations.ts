import { getUserById } from '@/features/auth/services/userCache';
import { isPrivateAccount } from '@/features/privacy/types';
import { followRequestActions } from '@/features/social/services/followRequests';
import i18n from '@/i18n';
import { store } from '@/store';
import { challengeActions } from '@/store/challengeStore';
import { notificationActions } from '@/store/notificationStore';
import { patchAuth } from '@/store/slices/authSlice';
import { addFollowingId, removeFollowingId } from '@/store/slices/privacySlice';
import { logger } from '@/utils/logger';
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';

type FollowResult = { success: boolean; error?: string; pending?: boolean };

function followRefs(currentUserId: string, otherUserId: string) {
  const db = getFirestore();
  return {
    following: doc(db, 'users', currentUserId, 'following', otherUserId),
    followers: doc(db, 'users', otherUserId, 'followers', currentUserId),
    currentUser: doc(db, 'users', currentUserId),
    otherUser: doc(db, 'users', otherUserId),
  };
}

/** Sayaç yazımı kullanıcıyı bekletmez; hata yalnızca loglanır. */
function bumpCounters(refs: ReturnType<typeof followRefs>, delta: number) {
  updateDoc(refs.currentUser, { followingCount: increment(delta) })
    .catch(error => logger.error('Following count update error:', error));
  updateDoc(refs.otherUser, { followersCount: increment(delta) })
    .catch(error => logger.error('Followers count update error:', error));
}

function shiftOwnFollowingCount(delta: number) {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return;
  store.dispatch(patchAuth({
    user: { ...currentUser, followingCount: Math.max((currentUser.followingCount || 0) + delta, 0) },
  }));
}

async function followUser(userIdToFollow: string): Promise<FollowResult> {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return { success: false, error: i18n.t('errors.userNotFound') };

  try {
    // Gizli hesap doğrudan takip edilemez: onaya düşen bir istek gönderilir.
    if (isPrivateAccount(await getUserById(userIdToFollow))) {
      return { ...(await followRequestActions.sendFollowRequest(userIdToFollow)), pending: true };
    }

    const refs = followRefs(currentUser.id, userIdToFollow);
    await Promise.all([
      setDoc(refs.following, { userId: userIdToFollow, followedAt: serverTimestamp() }),
      setDoc(refs.followers, { userId: currentUser.id, followedAt: serverTimestamp() }),
    ]);
    bumpCounters(refs, 1);

    shiftOwnFollowingCount(1);
    // Gizli hesap filtresi takip listesine bakar; anında güncel tutulur.
    store.dispatch(addFollowingId(userIdToFollow));

    notificationActions
      .createFollowNotification(currentUser.id, userIdToFollow, currentUser.displayName)
      .catch(error => logger.error('Follow notification error:', error));
    challengeActions.trackAction(currentUser.id, 'newFollows').catch(() => {});

    return { success: true };
  } catch (error) {
    logger.error('Follow user error:', error);
    return { success: false, error: i18n.t('social.followFailed') };
  }
}

async function unfollowUser(userIdToUnfollow: string): Promise<FollowResult> {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return { success: false, error: i18n.t('errors.userNotFound') };

  try {
    const refs = followRefs(currentUser.id, userIdToUnfollow);
    await Promise.all([deleteDoc(refs.following), deleteDoc(refs.followers)]);
    bumpCounters(refs, -1);

    shiftOwnFollowingCount(-1);
    store.dispatch(removeFollowingId(userIdToUnfollow));

    return { success: true };
  } catch (error) {
    logger.error('Unfollow user error:', error);
    return { success: false, error: i18n.t('social.unfollowFailed') };
  }
}

async function isFollowingUser(userId: string): Promise<boolean> {
  const currentUser = store.getState().auth.user;
  if (!currentUser) return false;
  try {
    const snapshot = await getDoc(followRefs(currentUser.id, userId).following);
    return snapshot.exists();
  } catch (error) {
    logger.error('Check following error:', error);
    return false;
  }
}

export const followRelationsActions = { followUser, unfollowUser, isFollowingUser };
