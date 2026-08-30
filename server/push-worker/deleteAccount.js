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
// kullanıyoruz. Başkalarının verisindeki izler cleanupUserTraces.js'te.
import { TRACE_CLEANUPS } from './cleanupUserTraces.js';

export async function deleteAllUserData(auth, db, uid) {
  // İzler kullanıcı dokümanı silinmeden ÖNCE temizlenmeli: following/followers
  // alt koleksiyonları hangi sayaçların düşeceğini söyleyen tek kayıt.
  //
  // Bu adımlar hesabın silinmesini ENGELLEMEMELİ: eksik index gibi bir hata
  // tüm akışı yarıda bırakırsa kullanıcı hesabını hiç silemez (App Store
  // gerekliliği). Hata loglanır, sayaç sapması haftalık reconcile-counters.js
  // koşusunda kapanır.
  for (const cleanup of TRACE_CLEANUPS) {
    try {
      await cleanup(db, uid);
    } catch (error) {
      console.error(`[delete-account] ${cleanup.name} başarısız (${uid}):`, error.message);
    }
  }

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
  // Cihaz kaydı gider; cihaz BANI (bannedDevices/{deviceId}) kalır — ban
  // cihaza bağlıdır, hesabı silmek banı kaldırmaz.
  await db.collection('userDevices').doc(uid).delete().catch(() => {});

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
