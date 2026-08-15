// Hesap silme — kalıcı çözüm (bkz. YAPILACAKLAR 0.4 / 3.1).
//
// İstemci tarafı silme (features/auth/services/userProfile.ts) DM
// thread'lerini silemiyordu (kural: allow delete: if false — istemci
// kendi verisinin ötesine geçemez) ve Google/Apple girişinde "requires-
// recent-login" hatasına takılabiliyordu. Admin SDK her ikisini de ortadan
// kaldırır: kurallara tabi değildir, session tazeliğine bakmaz.
//
// Admin SDK'nın recursiveDelete'i bir dokümanı VE tüm alt koleksiyonlarını
// tek çağrıda siler — stories/conversations/messageThreads ve users/{uid}
// (altındaki followers/following/likedStories/savedStories/
// likedConversations/readingLists/readingProgress/blocked dahil) için bunu
// kullanıyoruz.
import { FieldValue } from 'firebase-admin/firestore';

// Silinen kullanıcının takip ilişkilerini KARŞI taraflardan da temizle.
// recursiveDelete(users/uid) yalnızca bu kullanıcının kendi alt
// koleksiyonlarını siler; başka kullanıcılardaki followers/following
// dokümanları ve followersCount/followingCount sayaçları olduğu gibi kalıp
// "hayalet takipçi/takip" oluşturuyordu (sayaç şişik kalır, liste ise
// silinmiş profili çözemeyip gizler → tutarsızlık).
async function cleanupFollowRelations(db, uid) {
  // uid'in TAKİP ETTİKLERİ: her biri için followers/{uid} sil + followersCount--
  const following = await db.collection('users').doc(uid).collection('following').get();
  for (const d of following.docs) {
    const followedId = d.id; // following doc id == takip edilen kullanıcının uid'i
    await db.collection('users').doc(followedId).collection('followers').doc(uid).delete().catch(() => {});
    await db.collection('users').doc(followedId).update({ followersCount: FieldValue.increment(-1) }).catch(() => {});
  }
  // uid'i TAKİP EDENLER: her biri için following/{uid} sil + followingCount--
  const followers = await db.collection('users').doc(uid).collection('followers').get();
  for (const d of followers.docs) {
    const followerId = d.id; // followers doc id == takip eden kullanıcının uid'i
    await db.collection('users').doc(followerId).collection('following').doc(uid).delete().catch(() => {});
    await db.collection('users').doc(followerId).update({ followingCount: FieldValue.increment(-1) }).catch(() => {});
  }
}

export async function deleteAllUserData(auth, db, uid) {
  // Takip ilişkileri karşı taraflardan temizlenmeli — recursiveDelete(users/uid)
  // bunları görmez. Kullanıcı dokümanını silmeden ÖNCE (following/followers alt
  // koleksiyonları hâlâ okunabilirken) yap.
  await cleanupFollowRelations(db, uid);

  const stories = await db.collection('stories').where('authorId', '==', uid).get();
  for (const doc of stories.docs) {
    await db.recursiveDelete(doc.ref);
  }

  const conversations = await db.collection('conversations').where('authorId', '==', uid).get();
  for (const doc of conversations.docs) {
    await db.recursiveDelete(doc.ref);
  }

  // DM thread'leri — istemci bunu yapamıyordu (bkz. yukarıdaki not).
  const threads = await db.collection('messageThreads').where('participants', 'array-contains', uid).get();
  for (const doc of threads.docs) {
    await db.recursiveDelete(doc.ref);
  }

  // Kullanıcının aldığı bildirimler — kendi alt koleksiyonu değil, top-level
  // koleksiyonda userId ile filtrelenir.
  const notifications = await db.collection('notifications').where('userId', '==', uid).get();
  if (!notifications.empty) {
    const batch = db.batch();
    notifications.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await db.collection('userPushTokens').doc(uid).delete().catch(() => {});
  await db.collection('notificationSettings').doc(uid).delete().catch(() => {});

  // Kullanıcı dokümanı + tüm alt koleksiyonları.
  await db.recursiveDelete(db.collection('users').doc(uid));

  // Firebase Auth kaydı — Admin SDK re-authenticate gerektirmez.
  await auth.deleteUser(uid);
}

export async function handleDeleteAccount(auth, db, req, res) {
  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authorization: Bearer <idToken> gerekli' }));
      return;
    }

    const decoded = await auth.verifyIdToken(idToken);
    await deleteAllUserData(auth, db, decoded.uid);

    console.log('[delete-account] silindi:', decoded.uid);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('[delete-account] hata:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}
