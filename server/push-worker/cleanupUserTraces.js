// Silinen kullanıcının BAŞKALARININ verisinde bıraktığı izler.
//
// recursiveDelete(users/{uid}) yalnızca kullanıcının kendi alt koleksiyonlarını
// siler. Beğeni/yorum/takip/bildirim kayıtlarının asıl kopyası karşı tarafın
// dokümanı altındadır; temizlenmezse sayaçlar şişik kalır ve silinen kullanıcının
// adı/fotoğrafı başkalarının bildirim akışında durmaya devam eder.
//
// viewsCount bilinçli olarak DOKUNULMAZ: toplam görüntülenme metriğidir,
// okuyanın hesabı silinince hikâyenin okunmuşluğu geriye alınmaz.
import { FieldValue } from 'firebase-admin/firestore';

// Takip ilişkileri: her iki taraftaki doküman + sayaç.
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

// Gönderilmiş takip istekleri: users/{hedef}/followRequests/{uid}. Kullanıcının
// KENDİSİNE gelen istekler users/{uid} ile birlikte zaten gidiyor.
async function cleanupFollowRequests(db, uid) {
  const requests = await db.collectionGroup('followRequests').where('userId', '==', uid).get();
  for (const d of requests.docs) {
    await d.ref.delete().catch(() => {});
  }
}

// Tüm beğeniler tek sorguda: hikâye, bölüm, yorum ve konuşma beğenilerinin
// hepsi `likes` alt koleksiyonunda `userId` alanıyla duruyor ve dördünde de
// üst dokümanın sayacı `likesCount`.
async function cleanupLikes(db, uid) {
  const likes = await db.collectionGroup('likes').where('userId', '==', uid).get();
  for (const d of likes.docs) {
    const parent = d.ref.parent.parent; // likes koleksiyonunu taşıyan doküman
    await d.ref.delete().catch(() => {});
    if (parent) {
      await parent.update({ likesCount: FieldValue.increment(-1) }).catch(() => {});
    }
  }
}

// Hikâye yorumları. İstemcideki deleteComment ile aynı davranış: yorumun
// altındaki yanıtlar da silinir (yetim yanıt arayüzde görünmez ama sayaçta
// durur) ve commentsCount silinen toplam kadar düşer.
async function cleanupStoryComments(db, uid) {
  const comments = await db.collectionGroup('comments').where('userId', '==', uid).get();
  for (const commentDoc of comments.docs) {
    const commentsRef = commentDoc.ref.parent;
    const storyRef = commentsRef.parent;
    if (!storyRef) continue;

    let deleted = 0;
    const replies = await commentsRef.where('parentId', '==', commentDoc.id).get();
    for (const reply of replies.docs) {
      await db.recursiveDelete(reply.ref);
      deleted += 1;
    }
    await db.recursiveDelete(commentDoc.ref);
    deleted += 1;

    await storyRef.update({ commentsCount: FieldValue.increment(-deleted) }).catch(() => {});
  }
}

// Konuşma yorumları ayrı, top-level koleksiyonda tutulur.
async function cleanupConversationComments(db, uid) {
  const comments = await db.collection('conversationComments').where('userId', '==', uid).get();
  const perConversation = new Map();
  for (const d of comments.docs) {
    const conversationId = d.data().conversationId;
    await d.ref.delete().catch(() => {});
    if (conversationId) {
      perConversation.set(conversationId, (perConversation.get(conversationId) || 0) + 1);
    }
  }
  for (const [conversationId, count] of perConversation) {
    await db.collection('conversations').doc(conversationId)
      .update({ commentsCount: FieldValue.increment(-count) })
      .catch(() => {});
  }
}

// Kullanıcının GÖNDERDİĞİ bildirimler. Aldıkları (userId == uid) ayrıca
// siliniyor; gönderdikleri başkalarının akışında durur ve sadece bir id değil,
// görünen adı ile profil fotoğrafı URL'ini de taşır.
async function cleanupSentNotifications(db, uid) {
  const sent = await db.collection('notifications').where('senderId', '==', uid).get();
  if (sent.empty) return;
  const batch = db.batch();
  sent.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export const TRACE_CLEANUPS = [
  cleanupFollowRelations,
  cleanupFollowRequests,
  cleanupLikes,
  cleanupStoryComments,
  cleanupConversationComments,
  cleanupSentNotifications,
];
