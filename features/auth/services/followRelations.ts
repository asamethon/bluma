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
import { authState$, User } from '@/store/authState';

// Follow a user
async function followUser(userIdToFollow: string) {
  try {
    const currentUser = authState$.user.get();
    if (!currentUser) return { success: false, error: 'Kullanıcı bulunamadı.' };

    const db = getFirestore();

    // Asıl takip ilişkisi: iki doküman paralel yazılır. Yalnızca bunlar
    // beklenir — sayaçlar ve bildirim arka planda yürür ki buton saniyelerce
    // dönmesin (push bildirimi HTTP çağrısı tek başına 1-3 sn sürebiliyor).
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

    // Sayaçlar — atomik increment, arka planda; hata takibi bozmaz.
    updateDoc(doc(db, 'users', currentUser.id), {
      followingCount: increment(1),
    }).catch((e: any) => console.error('Following count update error:', e));
    updateDoc(doc(db, 'users', userIdToFollow), {
      followersCount: increment(1),
    }).catch((e: any) => console.error('Followers count update error:', e));

    // Bildirim (in-app + push) — arka planda.
    notificationActions.createFollowNotification(
      currentUser.id,
      userIdToFollow,
      currentUser.displayName
    ).catch((e: any) => console.error('Follow notification error:', e));

    // Update local state
    authState$.user.set({
      ...currentUser,
      followingCount: (currentUser.followingCount || 0) + 1,
    });

    return { success: true };
  } catch (error) {
    console.error('Follow user error:', error);
    return { success: false, error: 'Takip edilirken bir hata oluştu.' };
  }
}

// Unfollow a user
async function unfollowUser(userIdToUnfollow: string) {
  try {
    const currentUser = authState$.user.get();
    if (!currentUser) return { success: false, error: 'Kullanıcı bulunamadı.' };

    const db = getFirestore();

    // İlişki dokümanları paralel silinir; sayaçlar arka planda (bkz. followUser).
    const currentUserFollowingRef = doc(db, 'users', currentUser.id, 'following', userIdToUnfollow);
    const targetUserFollowersRef = doc(db, 'users', userIdToUnfollow, 'followers', currentUser.id);
    await Promise.all([
      deleteDoc(currentUserFollowingRef),
      deleteDoc(targetUserFollowersRef),
    ]);

    updateDoc(doc(db, 'users', currentUser.id), {
      followingCount: increment(-1),
    }).catch((e: any) => console.error('Following count update error:', e));
    updateDoc(doc(db, 'users', userIdToUnfollow), {
      followersCount: increment(-1),
    }).catch((e: any) => console.error('Followers count update error:', e));

    // Update local state
    authState$.user.set({
      ...currentUser,
      followingCount: Math.max((currentUser.followingCount || 0) - 1, 0),
    });

    return { success: true };
  } catch (error) {
    console.error('Unfollow user error:', error);
    return { success: false, error: 'Takipten çıkılırken bir hata oluştu.' };
  }
}

// Check if current user is following another user
async function isFollowingUser(userId: string): Promise<boolean> {
  try {
    const currentUser = authState$.user.get();
    if (!currentUser) return false;

    const db = getFirestore();
    const followingRef = doc(db, 'users', currentUser.id, 'following', userId);
    const followingDoc = await getDoc(followingRef);

    return followingDoc.exists();
  } catch (error) {
    console.error('Check following error:', error);
    return false;
  }
}

// Get user followers count
async function getUserFollowersCount(userId: string): Promise<number> {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return userData?.followersCount || 0;
  } catch (error) {
    console.error('Get followers count error:', error);
    return 0;
  }
}

// Search users by username or display name
async function searchUsers(searchQuery: string): Promise<User[]> {
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');

    // Clean search query
    const cleanQuery = searchQuery.toLowerCase().trim();
    if (cleanQuery.length < 2) {
      return []; // Minimum 2 karakter gerekli
    }

    const users: User[] = [];

    // Search by username (exact match first, then contains)
    const exactUsernameQuery = query(usersRef, where('username', '==', cleanQuery));
    const exactUsernameSnapshot = await getDocs(exactUsernameQuery);

    // Search by username (contains - for partial matches)
    const usernameQuery = query(usersRef, where('username', '>=', cleanQuery), where('username', '<=', cleanQuery + ''));
    const usernameSnapshot = await getDocs(usernameQuery);

    // Search by display name (contains). displayName büyük harfle
    // saklanabildiği için hem küçük harfli hem baş harfi büyük varyantı
    // sorgulanır ("samet" → "Samet"); aksi hâlde range sorgusu hiç eşleşmez.
    const capitalizedQuery =
      cleanQuery.charAt(0).toLocaleUpperCase('tr-TR') + cleanQuery.slice(1);
    const displayNameVariants = Array.from(new Set([cleanQuery, capitalizedQuery]));
    const displayNameSnapshots = await Promise.all(
      displayNameVariants.map(v =>
        getDocs(query(usersRef, where('displayName', '>=', v), where('displayName', '<=', v + '')))
      )
    );

    // Add exact username matches first (highest priority)
    exactUsernameSnapshot.forEach((doc: any) => {
      const userData = { id: doc.id, ...doc.data() } as User;
      if (!users.find(user => user.id === userData.id)) {
        users.push(userData);
      }
    });

    // Add partial username matches
    usernameSnapshot.forEach((doc: any) => {
      const userData = { id: doc.id, ...doc.data() } as User;
      if (!users.find(user => user.id === userData.id)) {
        users.push(userData);
      }
    });

    // Add display name matches (avoid duplicates)
    displayNameSnapshots.forEach(snapshot => {
      snapshot.forEach((doc: any) => {
        const userData = { id: doc.id, ...doc.data() } as User;
        if (!users.find(user => user.id === userData.id)) {
          users.push(userData);
        }
      });
    });

    // Sort results: exact matches first, then by relevance
    users.sort((a, b) => {
      const aUsername = a.username?.toLowerCase() || '';
      const bUsername = b.username?.toLowerCase() || '';
      const aDisplayName = a.displayName?.toLowerCase() || '';
      const bDisplayName = b.displayName?.toLowerCase() || '';

      // Exact username match gets highest priority
      if (aUsername === cleanQuery && bUsername !== cleanQuery) return -1;
      if (bUsername === cleanQuery && aUsername !== cleanQuery) return 1;

      // Username starts with query gets higher priority
      if (aUsername.startsWith(cleanQuery) && !bUsername.startsWith(cleanQuery)) return -1;
      if (bUsername.startsWith(cleanQuery) && !aUsername.startsWith(cleanQuery)) return 1;

      // Display name starts with query gets higher priority
      if (aDisplayName.startsWith(cleanQuery) && !bDisplayName.startsWith(cleanQuery)) return -1;
      if (bDisplayName.startsWith(cleanQuery) && !aDisplayName.startsWith(cleanQuery)) return 1;

      // Sort by follower count (more popular users first)
      return (b.followersCount || 0) - (a.followersCount || 0);
    });

    return users.slice(0, 20); // Limit to 20 results
  } catch (error) {
    console.error('Search users error:', error);
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
