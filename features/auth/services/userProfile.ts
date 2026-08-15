import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuth,
  getIdToken,
  reauthenticateWithCredential,
  signOut as firebaseSignOut,
  EmailAuthProvider,
  GoogleAuthProvider,
  AppleAuthProvider,
  deleteUser,
} from '@react-native-firebase/auth';
import { API_SERVER_URL } from '@/constants/config';
import { imageUploadService } from '@/services/imageUploadService';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  deleteDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { patchAuth, User } from '@/store/slices/authSlice';
import { getUserById as getCachedUserById, primeCachedUser } from '@/features/auth/services/userCache';
import { endSession } from '@/features/auth/services/sessionState';
import { store } from '@/store';
import i18n from '@/i18n';
import { storyApiActions } from '@/features/story/services/storyApi';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import { logger } from '@/utils/logger';

async function reauthenticateForDeletion(currentUser: User, firebaseUser: any) {
  if (currentUser.authProvider === 'google') {
    const userInfo: any = await GoogleSignin.signInSilently();
    const idToken = userInfo?.data?.idToken;
    if (!idToken) {
      throw Object.assign(new Error(i18n.t('authErrors.googleSessionMissing')), { code: 'auth/requires-recent-login' });
    }
    const credential = GoogleAuthProvider.credential(idToken);
    await reauthenticateWithCredential(firebaseUser, credential);
  } else if (currentUser.authProvider === 'apple') {
    if (!currentUser.appleUserId) {
      throw Object.assign(new Error(i18n.t('authErrors.appleUserIdMissing')), { code: 'auth/requires-recent-login' });
    }
    const refreshed = await AppleAuthentication.refreshAsync({ user: currentUser.appleUserId });
    if (!refreshed.identityToken) {
      throw Object.assign(new Error(i18n.t('authErrors.appleRefreshFailed')), { code: 'auth/requires-recent-login' });
    }
    const credential = AppleAuthProvider.credential(refreshed.identityToken);
    await reauthenticateWithCredential(firebaseUser, credential);
  }
}

async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty;
  } catch (error: any) {
    logger.error('Username availability check error:', error);

    if (error.code === 'firestore/permission-denied') {
      logger.debug('Firestore permission denied, assuming username is available');
      return true;
    }

    return false;
  }
}

async function getUserById(userId: string): Promise<User | null> {
  return getCachedUserById(userId);
}

async function completeOnboarding(userData: {
  username: string;
  interests: string[];
  bio: string;
  displayName?: string;
  profileImage?: string | null;
  intent?: 'reader' | 'writer' | 'both';
}) {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    const db = getFirestore();

    const isUsernameAvailable = await checkUsernameAvailability(userData.username);
    if (!isUsernameAvailable) {
      return { success: false, error: i18n.t('account.usernameTaken') };
    }

    const currentUser = store.getState().auth.user;
    if (currentUser) {
      let profileImageUrl: string | undefined;
      if (userData.profileImage) {
        try {
          profileImageUrl = await imageUploadService.uploadProfileImage(currentUser.id, userData.profileImage);
        } catch (uploadError) {
          logger.error('Onboarding profil fotoğrafı yüklenemedi:', uploadError);
        }
      }

      const updatedUser: User = {
        ...currentUser,
        username: userData.username,
        bio: userData.bio,
        interests: userData.interests,
        ...(userData.intent ? { intent: userData.intent } : {}),
        ...(userData.displayName ? { displayName: userData.displayName } : {}),
        ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
      };

      const userDocRef = doc(db, 'users', currentUser.id);
      await setDoc(userDocRef, {
        ...updatedUser,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');

      store.dispatch(patchAuth({ user: updatedUser }));
      store.dispatch(patchAuth({ hasCompletedOnboarding: true }));

      logger.debug('Onboarding completed successfully');
      return { success: true };
    }

  } catch (error) {
    logger.error('Onboarding error:', error);
    return { success: false, error: i18n.t('account.onboardingFailed') };
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function updateUserProfile(updatedUser: User) {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    const db = getFirestore();

    const userDocRef = doc(db, 'users', updatedUser.id);
    await setDoc(userDocRef, {
      ...updatedUser,
      updatedAt: serverTimestamp(),
    });

    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

    store.dispatch(patchAuth({ user: updatedUser }));
    primeCachedUser(updatedUser);

    return { success: true };
  } catch (error) {
    logger.error('Profile update error:', error);
    return { success: false, error: i18n.t('account.profileUpdateFailed') };
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

async function clearLocalAccountState(uid: string) {
  // Önce yerel durum temizlenir ki auth dinleyicisi araya girip oturumu geri kurmasın.
  await endSession({ asGuest: true });
  try { await firebaseSignOut(getAuth()); } catch {}
  await readingProgressActions.clearReadingProgressCache(uid);
}

async function deleteAccount(password?: string) {
  const currentUser = store.getState().auth.user;
  if (!currentUser) {
    return { success: false, error: i18n.t('errors.userNotFound') };
  }
  const firebaseUser = getAuth().currentUser;
  if (!firebaseUser) {
    return { success: false, error: i18n.t('errors.userNotFound') };
  }

  if (API_SERVER_URL) {
    try {
      store.dispatch(patchAuth({ isLoading: true }));
      const idToken = await getIdToken(firebaseUser);
      const res = await fetch(`${API_SERVER_URL}/delete-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        return { success: false, error: result.error || i18n.t('account.deleteFailed') };
      }
      await clearLocalAccountState(currentUser.id);
      logger.debug('Account deletion successful (server)');
      return { success: true };
    } catch (error) {
      logger.error('Account deletion error (server):', error);
      return { success: false, error: i18n.t('errors.serverUnreachable') };
    } finally {
      store.dispatch(patchAuth({ isLoading: false }));
    }
  }

  return deleteAccountClientSide(password, currentUser, firebaseUser);
}

async function deleteAccountClientSide(password: string | undefined, currentUser: User, firebaseUser: any) {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    try {
      if (password && currentUser.authProvider === 'email') {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(firebaseUser, credential);
      } else if (currentUser.authProvider !== 'email') {
        await reauthenticateForDeletion(currentUser, firebaseUser);
      }
      logger.debug('User re-authenticated successfully');
    } catch (reauthError: any) {
      if (reauthError.code === 'auth/wrong-password') {
        return { success: false, error: i18n.t('authErrors.wrongPassword') };
      } else if (reauthError.code === 'auth/user-mismatch') {
        return { success: false, error: i18n.t('account.userMismatch') };
      } else if (reauthError.code === 'auth/requires-recent-login') {
        return { success: false, error: i18n.t('account.deleteRequiresRelogin') };
      } else {
        return { success: false, error: i18n.t('account.reauthFailed') };
      }
    }

    const db = getFirestore();

    const storiesRef = query(collection(db, 'stories'), where('authorId', '==', currentUser.id));
    const storiesSnapshot = await getDocs(storiesRef);
    for (const storyDoc of storiesSnapshot.docs) {
      await storyApiActions.deleteStory(storyDoc.id);
    }

    const conversationsRef = query(collection(db, 'conversations'), where('authorId', '==', currentUser.id));
    const conversationsSnapshot = await getDocs(conversationsRef);
    await Promise.all(conversationsSnapshot.docs.map(d => deleteDoc(d.ref)));

    const followersRef = collection(db, 'users', currentUser.id, 'followers');
    const followingRef = collection(db, 'users', currentUser.id, 'following');
    const followersSnapshot = await getDocs(followersRef);
    const followingSnapshot = await getDocs(followingRef);
    await Promise.all([
      ...followersSnapshot.docs.map(d => deleteDoc(d.ref)),
      ...followingSnapshot.docs.map(d => deleteDoc(d.ref)),
    ]);

    const personalSubcollections = ['likedStories', 'savedStories', 'likedConversations', 'readingLists', 'readingProgress', 'blocked', 'followRequests'];
    for (const sub of personalSubcollections) {
      const snapshot = await getDocs(collection(db, 'users', currentUser.id, sub));
      await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
    }

    const notificationsSnapshot = await getDocs(query(collection(db, 'notifications'), where('userId', '==', currentUser.id)));
    await Promise.all(notificationsSnapshot.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'userPushTokens', currentUser.id)).catch(() => {});
    await deleteDoc(doc(db, 'notificationSettings', currentUser.id)).catch(() => {});


    await deleteDoc(doc(db, 'users', currentUser.id));

    await deleteUser(firebaseUser);

    await clearLocalAccountState(currentUser.id);

    logger.debug('Account deletion successful');
    return { success: true };
  } catch (error: any) {
    logger.error('Account deletion error:', error);
    store.dispatch(patchAuth({ isLoading: false }));

    if (error.code === 'auth/requires-recent-login') {
      return { success: false, error: i18n.t('account.deleteNeedsPassword') };
    } else if (error.code === 'auth/user-not-found') {
      return { success: false, error: i18n.t('errors.userNotFound') };
    } else if (error.code === 'auth/network-request-failed') {
      return { success: false, error: i18n.t('authErrors.network') };
    } else {
      return { success: false, error: i18n.t('account.deleteFailed') };
    }
  }
}

export const userProfileActions = {
  checkUsernameAvailability,
  completeOnboarding,
  updateUserProfile,
  getUserById,
  deleteAccount,
};
