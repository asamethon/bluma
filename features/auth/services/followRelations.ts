import firestore from '@react-native-firebase/firestore';
import { notificationActions } from '../../../store/notificationStore';
import { authState$, User } from '../../../store/authStore';

// Follow a user
async function followUser(userIdToFollow: string) {
  try {
    const currentUser = authState$.user.get();
    if (!currentUser) return { success: false, error: 'Kullanıcı bulunamadı.' };

    const db = firestore();

    // Asıl takip ilişkisi: iki doküman paralel yazılır. Yalnızca bunlar
    // beklenir — sayaçlar ve bildirim arka planda yürür ki buton saniyelerce
    // dönmesin (push bildirimi HTTP çağrısı tek başına 1-3 sn sürebiliyor).
    const currentUserFollowingRef = db.collection('users').doc(currentUser.id).collection('following').doc(userIdToFollow);
    const targetUserFollowersRef = db.collection('users').doc(userIdToFollow).collection('followers').doc(currentUser.id);
    await Promise.all([
      currentUserFollowingRef.set({
        userId: userIdToFollow,
        followedAt: firestore.FieldValue.serverTimestamp(),
      }),
      targetUserFollowersRef.set({
        userId: currentUser.id,
        followedAt: firestore.FieldValue.serverTimestamp(),
      }),
    ]);

    // Sayaçlar — atomik increment, arka planda; hata takibi bozmaz.
    db.collection('users').doc(currentUser.id).update({
      followingCount: firestore.FieldValue.increment(1),
    }).catch((e: any) => console.error('Following count update error:', e));
    db.collection('users').doc(userIdToFollow).update({
      followersCount: firestore.FieldValue.increment(1),
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

    const db = firestore();

    // İlişki dokümanları paralel silinir; sayaçlar arka planda (bkz. followUser).
    const currentUserFollowingRef = db.collection('users').doc(currentUser.id).collection('following').doc(userIdToUnfollow);
    const targetUserFollowersRef = db.collection('users').doc(userIdToUnfollow).collection('followers').doc(currentUser.id);
    await Promise.all([
      currentUserFollowingRef.delete(),
      targetUserFollowersRef.delete(),
    ]);

    db.collection('users').doc(currentUser.id).update({
      followingCount: firestore.FieldValue.increment(-1),
    }).catch((e: any) => console.error('Following count update error:', e));
    db.collection('users').doc(userIdToUnfollow).update({
      followersCount: firestore.FieldValue.increment(-1),
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

    const db = firestore();
    const followingRef = db.collection('users').doc(currentUser.id).collection('following').doc(userId);
    const followingDoc = await followingRef.get();

    return followingDoc.exists();
  } catch (error) {
    console.error('Check following error:', error);
    return false;
  }
}

// Get user followers count
async function getUserFollowersCount(userId: string): Promise<number> {
  try {
    const db = firestore();
    const userDoc = await db.collection('users').doc(userId).get();
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
    const db = firestore();
    const usersRef = db.collection('users');

    // Clean search query
    const cleanQuery = searchQuery.toLowerCase().trim();
    if (cleanQuery.length < 2) {
      return []; // Minimum 2 karakter gerekli
    }

    const users: User[] = [];

    // Search by username (exact match first, then contains)
    const exactUsernameQuery = usersRef.where('username', '==', cleanQuery);
    const exactUsernameSnapshot = await exactUsernameQuery.get();

    // Search by username (contains - for partial matches)
    const usernameQuery = usersRef.where('username', '>=', cleanQuery).where('username', '<=', cleanQuery + '');
    const usernameSnapshot = await usernameQuery.get();

    // Search by display name (contains). displayName büyük harfle
    // saklanabildiği için hem küçük harfli hem baş harfi büyük varyantı
    // sorgulanır ("samet" → "Samet"); aksi hâlde range sorgusu hiç eşleşmez.
    const capitalizedQuery =
      cleanQuery.charAt(0).toLocaleUpperCase('tr-TR') + cleanQuery.slice(1);
    const displayNameVariants = Array.from(new Set([cleanQuery, capitalizedQuery]));
    const displayNameSnapshots = await Promise.all(
      displayNameVariants.map(v =>
        usersRef.where('displayName', '>=', v).where('displayName', '<=', v + '').get()
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
