import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  increment,
} from '@react-native-firebase/firestore';
import { notificationActions } from '../../../store/notificationStore';
import { challengeActions } from '@/store/challengeStore';
import { privacyActions } from '@/features/privacy/services/privacyService';
import { isPrivateAccount } from '@/features/privacy/types';
import { followRequestActions } from '@/features/social/services/followRequests';
import { getUserById as getCachedUserById } from '@/features/auth/services/userCache';
import { patchAuth, User } from '@/store/slices/authSlice';
import { addFollowingId, removeFollowingId } from '@/store/slices/privacySlice';
import { store } from '@/store';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';

async function followUser(userIdToFollow: string) {
  try {
    const currentUser = store.getState().auth.user;
    if (!currentUser) return { success: false, error: i18n.t('errors.userNotFound') };

    // Gizli hesap doğrudan takip edilemez: onaya düşen bir istek gönderilir.
    const target = await getCachedUserById(userIdToFollow);
    if (isPrivateAccount(target)) {
      const result = await followRequestActions.sendFollowRequest(userIdToFollow);
      return { ...result, pending: true };
    }

    const db = getFirestore();

    const currentUserFollowingRef = doc(db, 'users', currentUser.id, 'following', userIdToFollow);
    const targetUserFollowersRef = doc(db, 'users', userIdToFollow, 'followers', currentUser.id);
    await Promise.all([
      setDoc(currentUserFollowingRef, {
        userId: userIdToFollow,
        followedAt: serverTimestamp(),
      }),
      setDoc(targetUserFollowersRef, {
        userId: currentUser.id,
        followedAt: serverTimestamp(),
      }),
    ]);

    updateDoc(doc(db, 'users', currentUser.id), {
      followingCount: increment(1),
    }).catch((e: any) => logger.error('Following count update error:', e));
    updateDoc(doc(db, 'users', userIdToFollow), {
      followersCount: increment(1),
    }).catch((e: any) => logger.error('Followers count update error:', e));

    notificationActions.createFollowNotification(
      currentUser.id,
      userIdToFollow,
      currentUser.displayName
    ).catch((e: any) => logger.error('Follow notification error:', e));

    store.dispatch(patchAuth({ user: {
      ...currentUser,
      followingCount: (currentUser.followingCount || 0) + 1,
    } }));
    // Gizli hesap filtresi takip listesine bakar; anında güncel tutulur.
    store.dispatch(addFollowingId(userIdToFollow));

    challengeActions.trackAction(currentUser.id, 'newFollows').catch(() => {});

    return { success: true };
  } catch (error) {
    logger.error('Follow user error:', error);
    return { success: false, error: i18n.t('social.followFailed') };
  }
}

async function unfollowUser(userIdToUnfollow: string) {
  try {
    const currentUser = store.getState().auth.user;
    if (!currentUser) return { success: false, error: i18n.t('errors.userNotFound') };

    const db = getFirestore();

    const currentUserFollowingRef = doc(db, 'users', currentUser.id, 'following', userIdToUnfollow);
    const targetUserFollowersRef = doc(db, 'users', userIdToUnfollow, 'followers', currentUser.id);
    await Promise.all([
      deleteDoc(currentUserFollowingRef),
      deleteDoc(targetUserFollowersRef),
    ]);

    updateDoc(doc(db, 'users', currentUser.id), {
      followingCount: increment(-1),
    }).catch((e: any) => logger.error('Following count update error:', e));
    updateDoc(doc(db, 'users', userIdToUnfollow), {
      followersCount: increment(-1),
    }).catch((e: any) => logger.error('Followers count update error:', e));

    store.dispatch(patchAuth({ user: {
      ...currentUser,
      followingCount: Math.max((currentUser.followingCount || 0) - 1, 0),
    } }));
    store.dispatch(removeFollowingId(userIdToUnfollow));

    return { success: true };
  } catch (error) {
    logger.error('Unfollow user error:', error);
    return { success: false, error: i18n.t('social.unfollowFailed') };
  }
}

async function isFollowingUser(userId: string): Promise<boolean> {
  try {
    const currentUser = store.getState().auth.user;
    if (!currentUser) return false;

    const db = getFirestore();
    const followingRef = doc(db, 'users', currentUser.id, 'following', userId);
    const followingDoc = await getDoc(followingRef);

    return followingDoc.exists();
  } catch (error) {
    logger.error('Check following error:', error);
    return false;
  }
}

async function getUserFollowersCount(userId: string): Promise<number> {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return userData?.followersCount || 0;
  } catch (error) {
    logger.error('Get followers count error:', error);
    return 0;
  }
}

async function searchUsers(searchQuery: string): Promise<User[]> {
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');

    const cleanQuery = searchQuery.toLowerCase().trim();
    if (cleanQuery.length < 2) {
      return [];
    }

    const users: User[] = [];

    const exactUsernameQuery = query(usersRef, where('username', '==', cleanQuery));
    const exactUsernameSnapshot = await getDocs(exactUsernameQuery);

    const usernameQuery = query(usersRef, where('username', '>=', cleanQuery), where('username', '<=', cleanQuery + ''));
    const usernameSnapshot = await getDocs(usernameQuery);

    const capitalizedQuery =
      cleanQuery.charAt(0).toLocaleUpperCase('tr-TR') + cleanQuery.slice(1);
    const displayNameVariants = Array.from(new Set([cleanQuery, capitalizedQuery]));
    const displayNameSnapshots = await Promise.all(
      displayNameVariants.map(v =>
        getDocs(query(usersRef, where('displayName', '>=', v), where('displayName', '<=', v + '')))
      )
    );

    exactUsernameSnapshot.forEach((doc: any) => {
      const userData = { id: doc.id, ...doc.data() } as User;
      if (!users.find(user => user.id === userData.id)) {
        users.push(userData);
      }
    });

    usernameSnapshot.forEach((doc: any) => {
      const userData = { id: doc.id, ...doc.data() } as User;
      if (!users.find(user => user.id === userData.id)) {
        users.push(userData);
      }
    });

    displayNameSnapshots.forEach(snapshot => {
      snapshot.forEach((doc: any) => {
        const userData = { id: doc.id, ...doc.data() } as User;
        if (!users.find(user => user.id === userData.id)) {
          users.push(userData);
        }
      });
    });

    users.sort((a, b) => {
      const aUsername = a.username?.toLowerCase() || '';
      const bUsername = b.username?.toLowerCase() || '';
      const aDisplayName = a.displayName?.toLowerCase() || '';
      const bDisplayName = b.displayName?.toLowerCase() || '';

      if (aUsername === cleanQuery && bUsername !== cleanQuery) return -1;
      if (bUsername === cleanQuery && aUsername !== cleanQuery) return 1;

      if (aUsername.startsWith(cleanQuery) && !bUsername.startsWith(cleanQuery)) return -1;
      if (bUsername.startsWith(cleanQuery) && !aUsername.startsWith(cleanQuery)) return 1;

      if (aDisplayName.startsWith(cleanQuery) && !bDisplayName.startsWith(cleanQuery)) return -1;
      if (bDisplayName.startsWith(cleanQuery) && !aDisplayName.startsWith(cleanQuery)) return 1;

      return (b.followersCount || 0) - (a.followersCount || 0);
    });

    // "Aramada göster" kapalı hesaplar sonuçlardan düşer.
    return privacyActions.filterDiscoverable(users).slice(0, 20);
  } catch (error) {
    logger.error('Search users error:', error);
    return [];
  }
}

export const followRelationsActions = {
  followUser,
  unfollowUser,
  isFollowingUser,
  getUserFollowersCount,
  searchUsers,
};
