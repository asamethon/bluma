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
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { patchAuth, User } from '@/store/slices/authSlice';
import { store } from '@/store';
import { storyApiActions } from '@/features/story/services/storyApi';
import { readingProgressActions } from '@/features/story/services/readingProgress';

// Google/Apple girişli kullanıcıda Firebase oturumu eskiyse deleteUser
// `auth/requires-recent-login` ile patlar; hesabı gerçekten silebilmek için
// önce sessizce reauthenticate ediyoruz (Apple'ın hesap silme zorunluluğu).
async function reauthenticateForDeletion(currentUser: User, firebaseUser: any) {
  if (currentUser.authProvider === 'google') {
    const userInfo: any = await GoogleSignin.signInSilently();
    const idToken = userInfo?.data?.idToken;
    if (!idToken) {
      throw Object.assign(new Error('Google oturumu bulunamadı'), { code: 'auth/requires-recent-login' });
    }
    const credential = GoogleAuthProvider.credential(idToken);
    await reauthenticateWithCredential(firebaseUser, credential);
  } else if (currentUser.authProvider === 'apple') {
    if (!currentUser.appleUserId) {
      throw Object.assign(new Error('Apple kullanıcı kimliği bulunamadı'), { code: 'auth/requires-recent-login' });
    }
    const refreshed = await AppleAuthentication.refreshAsync({ user: currentUser.appleUserId });
    if (!refreshed.identityToken) {
      throw Object.assign(new Error('Apple kimlik doğrulaması yenilenemedi'), { code: 'auth/requires-recent-login' });
    }
    const credential = AppleAuthProvider.credential(refreshed.identityToken);
    await reauthenticateWithCredential(firebaseUser, credential);
  }
}

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
    store.dispatch(patchAuth({ isLoading: true }));

    const db = getFirestore();

    // Check if username is available
    const isUsernameAvailable = await checkUsernameAvailability(userData.username);
    if (!isUsernameAvailable) {
      return { success: false, error: 'Bu kullanıcı adı zaten kullanımda.' };
    }

    // Update user data
    const currentUser = store.getState().auth.user;
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
      store.dispatch(patchAuth({ user: updatedUser }));
      store.dispatch(patchAuth({ hasCompletedOnboarding: true }));

      console.log('Onboarding completed successfully');
      return { success: true };
    }

  } catch (error) {
    console.error('Onboarding error:', error);
    return { success: false, error: 'Profil oluşturulurken bir hata oluştu.' };
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

// Update user profile
async function updateUserProfile(updatedUser: User) {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

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
    store.dispatch(patchAuth({ user: updatedUser }));

    console.log('Profile updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, error: 'Profil güncellenirken bir hata oluştu.' };
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

// Uygulama içinde kalan durumu temizler (server ya da client silme yolu
// başarılı olduktan sonra ortak adım).
async function clearLocalAccountState(uid: string) {
  // Hesap sunucu tarafında (Admin SDK) silindi — istemcinin kendi Firebase
  // Auth oturumu hâlâ "giriş yapılmış" sanabilir, yerel oturumu da kapat.
  try { await firebaseSignOut(getAuth()); } catch {}

  await AsyncStorage.multiRemove(['userToken', 'authProvider', 'userData', 'hasCompletedOnboarding']);
  await readingProgressActions.clearReadingProgressCache(uid);
  store.dispatch(patchAuth({ isAuthenticated: false }));
  store.dispatch(patchAuth({ hasCompletedOnboarding: false }));
  // "Oturum yok" durumunun tek karşılığı isGuest:true — false bırakılırsa
  // isGuest'e bakan ekranlar ne misafir ne giriş yapılmış durumunu
  // karşılamadığından bozuk/asılı kalıyor (bkz. session.ts signOut()).
  store.dispatch(patchAuth({ isGuest: true }));
  store.dispatch(patchAuth({ user: null }));
  store.dispatch(patchAuth({ token: null }));
}

// Delete user account — API_SERVER_URL yapılandırılmışsa VPS'teki
// push-worker/delete-account'a delege eder (Admin SDK: reauthenticate
// gerektirmez, DM thread'lerini de siler — bkz. YAPILACAKLAR 0.4/3.1).
// Yapılandırılmamışsa eski istemci-taraflı akışa düşer.
async function deleteAccount(password?: string) {
  const currentUser = store.getState().auth.user;
  if (!currentUser) {
    return { success: false, error: 'Kullanıcı bulunamadı.' };
  }
  const firebaseUser = getAuth().currentUser;
  if (!firebaseUser) {
    return { success: false, error: 'Firebase kullanıcısı bulunamadı.' };
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
        return { success: false, error: result.error || 'Hesap silinirken bir hata oluştu.' };
      }
      await clearLocalAccountState(currentUser.id);
      console.log('Account deletion successful (server)');
      return { success: true };
    } catch (error) {
      console.error('Account deletion error (server):', error);
      return { success: false, error: 'Sunucuya ulaşılamadı. Lütfen tekrar dene.' };
    } finally {
      store.dispatch(patchAuth({ isLoading: false }));
    }
  }

  return deleteAccountClientSide(password, currentUser, firebaseUser);
}

async function deleteAccountClientSide(password: string | undefined, currentUser: User, firebaseUser: any) {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    // Re-authenticate: password for email accounts, silent Google/Apple
    // credential refresh for social accounts (deleteUser fails with
    // auth/requires-recent-login otherwise if the session isn't fresh).
    try {
      if (password && currentUser.authProvider === 'email') {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(firebaseUser, credential);
      } else if (currentUser.authProvider !== 'email') {
        await reauthenticateForDeletion(currentUser, firebaseUser);
      }
      console.log('User re-authenticated successfully');
    } catch (reauthError: any) {
      if (reauthError.code === 'auth/wrong-password') {
        return { success: false, error: 'Hatalı şifre.' };
      } else if (reauthError.code === 'auth/user-mismatch') {
        return { success: false, error: 'Kullanıcı bilgileri eşleşmiyor.' };
      } else if (reauthError.code === 'auth/requires-recent-login') {
        return { success: false, error: 'Hesabını silmek için lütfen çıkış yapıp tekrar giriş yap.' };
      } else {
        return { success: false, error: 'Kimlik doğrulama hatası.' };
      }
    }

    const db = getFirestore();

    // Hikâyeleri deleteStory() ile sil — alt koleksiyonları (likes/views/
    // comments) doğru sırada temizler, storiesCount'u düşürür. Raw deleteDoc
    // bunları yetim bırakıyordu ve kurallar gereği bir daha silinemiyordu.
    const storiesRef = query(collection(db, 'stories'), where('authorId', '==', currentUser.id));
    const storiesSnapshot = await getDocs(storiesRef);
    for (const storyDoc of storiesSnapshot.docs) {
      await storyApiActions.deleteStory(storyDoc.id);
    }

    // Delete user's conversations
    const conversationsRef = query(collection(db, 'conversations'), where('authorId', '==', currentUser.id));
    const conversationsSnapshot = await getDocs(conversationsRef);
    await Promise.all(conversationsSnapshot.docs.map(d => deleteDoc(d.ref)));

    // Delete user's followers/following relationships
    const followersRef = collection(db, 'users', currentUser.id, 'followers');
    const followingRef = collection(db, 'users', currentUser.id, 'following');
    const followersSnapshot = await getDocs(followersRef);
    const followingSnapshot = await getDocs(followingRef);
    await Promise.all([
      ...followersSnapshot.docs.map(d => deleteDoc(d.ref)),
      ...followingSnapshot.docs.map(d => deleteDoc(d.ref)),
    ]);

    // Kullanıcının kişisel alt koleksiyonlarını temizle (KVKK/GDPR).
    const personalSubcollections = ['likedStories', 'savedStories', 'likedConversations', 'readingLists', 'readingProgress', 'blocked'];
    for (const sub of personalSubcollections) {
      const snapshot = await getDocs(collection(db, 'users', currentUser.id, sub));
      await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
    }

    // Kullanıcıya ait bildirimler, push token ve bildirim tercihleri
    const notificationsSnapshot = await getDocs(query(collection(db, 'notifications'), where('userId', '==', currentUser.id)));
    await Promise.all(notificationsSnapshot.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'userPushTokens', currentUser.id)).catch(() => {});
    await deleteDoc(doc(db, 'notificationSettings', currentUser.id)).catch(() => {});

    // NOT: DM thread'leri (messageThreads) kasıtlı olarak silinmiyor — diğer
    // katılımcının konuşma geçmişini korumak için kural `delete: if false`.
    // Kalıcı çözüm FAZ 3: tek Cloud Function ile tüm kullanıcı verisini sil.

    // Delete user document
    await deleteDoc(doc(db, 'users', currentUser.id));

    // Delete Firebase auth user
    await deleteUser(firebaseUser);

    await clearLocalAccountState(currentUser.id);

    console.log('Account deletion successful');
    return { success: true };
  } catch (error: any) {
    console.error('Account deletion error:', error);
    store.dispatch(patchAuth({ isLoading: false }));

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
