import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { authState$, User } from '../../../store/authStore';

// Check if username is available
async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const db = firestore();
    const usersRef = db.collection('users');
    const q = usersRef.where('username', '==', username);
    const querySnapshot = await q.get();

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
    const db = firestore();
    const userDoc = await db.collection('users').doc(userId).get();

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

    const db = firestore();

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
      const userDocRef = db.collection('users').doc(currentUser.id);
      await userDocRef.set({
        ...updatedUser,
        updatedAt: firestore.FieldValue.serverTimestamp(),
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

    const db = firestore();

    // Save to Firestore
    const userDocRef = db.collection('users').doc(updatedUser.id);
    await userDocRef.set({
      ...updatedUser,
      updatedAt: firestore.FieldValue.serverTimestamp(),
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

    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      return { success: false, error: 'Firebase kullanıcısı bulunamadı.' };
    }

    // If password is provided, re-authenticate user
    if (password && currentUser.authProvider === 'email') {
      try {
        const credential = auth.EmailAuthProvider.credential(currentUser.email, password);
        await firebaseUser.reauthenticateWithCredential(credential);
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

    const db = firestore();

    // Delete user's stories
    const storiesRef = db.collection('stories').where('authorId', '==', currentUser.id);
    const storiesSnapshot = await storiesRef.get();
    const storyDeletionPromises = storiesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(storyDeletionPromises);

    // Delete user's conversations
    const conversationsRef = db.collection('conversations').where('authorId', '==', currentUser.id);
    const conversationsSnapshot = await conversationsRef.get();
    const conversationDeletionPromises = conversationsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(conversationDeletionPromises);

    // Delete user's followers/following relationships
    const followersRef = db.collection('users').doc(currentUser.id).collection('followers');
    const followingRef = db.collection('users').doc(currentUser.id).collection('following');

    const followersSnapshot = await followersRef.get();
    const followingSnapshot = await followingRef.get();

    const followerDeletionPromises = followersSnapshot.docs.map(doc => doc.ref.delete());
    const followingDeletionPromises = followingSnapshot.docs.map(doc => doc.ref.delete());

    await Promise.all([...followerDeletionPromises, ...followingDeletionPromises]);

    // Delete user document
    await db.collection('users').doc(currentUser.id).delete();

    // Delete Firebase auth user
    await firebaseUser.delete();

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
