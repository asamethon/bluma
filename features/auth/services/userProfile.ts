import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  deleteDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { authState$, User } from '@/store/authState';

// Check if username is available
async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty; // true if username is available, false if taken
  } catch (error: any) {
    console.error('Username availability check error:', error);

    // If Firestore permission denied, assume username is available to allow signup to continue
    if (error.code === 'firestore/permission-denied') {
      console.log('Firestore permission denied, assuming username is available');
      return true;
    }

    // For other errors, assume taken to be safe
    return false;
  }
}

// Get user by ID
async function getUserById(userId: string): Promise<User | null> {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }

    return null;
  } catch (error) {
    console.error('Get user by ID error:', error);
    return null;
  }
}

// Complete onboarding
async function completeOnboarding(userData: { username: string; interests: string[]; bio: string }) {
  try {
    authState$.isLoading.set(true);

    const db = getFirestore();

    // Check if username is available
    const isUsernameAvailable = await checkUsernameAvailability(userData.username);
    if (!isUsernameAvailable) {
      return { success: false, error: 'Bu kullanıcı adı zaten kullanımda.' };
    }

    // Update user data
    const currentUser = authState$.user.get();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        username: userData.username,
        bio: userData.bio,
        interests: userData.interests,
      };

      // Save to Firestore
      const userDocRef = doc(db, 'users', currentUser.id);
      await setDoc(userDocRef, {
        ...updatedUser,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Save to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');

      // Update state
      authState$.user.set(updatedUser);
      authState$.hasCompletedOnboarding.set(true);

      console.log('Onboarding completed successfully');
      return { success: true };
    }

  } catch (error) {
    console.error('Onboarding error:', error);
    return { success: false, error: 'Profil oluşturulurken bir hata oluştu.' };
  } finally {
    authState$.isLoading.set(false);
  }
}

// Update user profile
async function updateUserProfile(updatedUser: User) {
  try {
    authState$.isLoading.set(true);

    const db = getFirestore();

    // Save to Firestore
    const userDocRef = doc(db, 'users', updatedUser.id);
    await setDoc(userDocRef, {
      ...updatedUser,
      updatedAt: serverTimestamp(),
    });

    // Save to AsyncStorage
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

    // Update state
    authState$.user.set(updatedUser);

    console.log('Profile updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, error: 'Profil güncellenirken bir hata oluştu.' };
  } finally {
    authState$.isLoading.set(false);
  }
}

// Delete user account
async function deleteAccount(password?: string) {
  try {
    authState$.isLoading.set(true);

    const currentUser = authState$.user.get();
    if (!currentUser) {
      return { success: false, error: 'Kullanıcı bulunamadı.' };
    }

    const firebaseUser = getAuth().currentUser;
    if (!firebaseUser) {
      return { success: false, error: 'Firebase kullanıcısı bulunamadı.' };
    }

    // If password is provided, re-authenticate user
    if (password && currentUser.authProvider === 'email') {
      try {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(firebaseUser, credential);
        console.log('User re-authenticated successfully');
      } catch (reauthError: any) {
        if (reauthError.code === 'auth/wrong-password') {
          return { success: false, error: 'Hatalı şifre.' };
        } else if (reauthError.code === 'auth/user-mismatch') {
          return { success: false, error: 'Kullanıcı bilgileri eşleşmiyor.' };
        } else {
          return { success: false, error: 'Kimlik doğrulama hatası.' };
        }
      }
    }

    const db = getFirestore();

    // Delete user's stories
    const storiesRef = query(collection(db, 'stories'), where('authorId', '==', currentUser.id));
    const storiesSnapshot = await getDocs(storiesRef);
    const storyDeletionPromises = storiesSnapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(storyDeletionPromises);

    // Delete user's conversations
    const conversationsRef = query(collection(db, 'conversations'), where('authorId', '==', currentUser.id));
    const conversationsSnapshot = await getDocs(conversationsRef);
    const conversationDeletionPromises = conversationsSnapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(conversationDeletionPromises);

    // Delete user's followers/following relationships
    const followersRef = collection(db, 'users', currentUser.id, 'followers');
    const followingRef = collection(db, 'users', currentUser.id, 'following');

    const followersSnapshot = await getDocs(followersRef);
    const followingSnapshot = await getDocs(followingRef);

    const followerDeletionPromises = followersSnapshot.docs.map(d => deleteDoc(d.ref));
    const followingDeletionPromises = followingSnapshot.docs.map(d => deleteDoc(d.ref));

    await Promise.all([...followerDeletionPromises, ...followingDeletionPromises]);

    // Delete user document
    await deleteDoc(doc(db, 'users', currentUser.id));

    // Delete Firebase auth user
    await deleteUser(firebaseUser);

    // Clear AsyncStorage
    await AsyncStorage.multiRemove([
      'userToken',
      'authProvider',
      'userData',
      'hasCompletedOnboarding',
    ]);

    // Reset state
    authState$.isAuthenticated.set(false);
    authState$.hasCompletedOnboarding.set(false);
    authState$.user.set(null);
    authState$.token.set(null);
    authState$.isLoading.set(false);

    console.log('Account deletion successful');
    return { success: true };
  } catch (error: any) {
    console.error('Account deletion error:', error);
    authState$.isLoading.set(false);

    if (error.code === 'auth/requires-recent-login') {
      return { success: false, error: 'Hesap silmek için şifreni tekrar girmen gerekiyor.' };
    } else if (error.code === 'auth/user-not-found') {
      return { success: false, error: 'Kullanıcı bulunamadı.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Ağ bağlantısı hatası.' };
    } else {
      return { success: false, error: 'Hesap silinirken bir hata oluştu.' };
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
