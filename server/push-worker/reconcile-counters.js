// Sayaç düzeltme cron'u (bkz. YAPILACAKLAR 3.1) — atomik increment() her zaman
// doğru kullanılsa bile ağ kopması / yarım kalan işlem gibi durumlarda sayaçlar
// zamanla gerçek veriden kayabilir. Bu script haftada bir çalışır, gerçek alt
// koleksiyon sayılarını hesaplayıp sapan sayaçları düzeltir.
//
// Ayrıca silinmiş kullanıcılara ait "hayalet" beğeni/yorum dokümanlarını budar:
// hesap silme akışı düzeltilmeden önce oluşan bu dokümanlar sayaçları şişik
// tutuyordu (arayüzde kimse görünmüyor ama sayı düşmüyor).
//
// Kullanım: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node reconcile-counters.js [--dry-run]

// firebase-admin v14+ eski admin.credential.X() / admin.firestore() namespace
// API'sini kaldırdı — modüler alt-yol importları gerekiyor.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const DRY_RUN = process.argv.includes('--dry-run');

const app = initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);
const auth = getAuth(app);

// Var olan kullanıcı ID kümesi.
let existingUsers = new Set();
// Auth'ta var olduğu doğrulanmış ama users dokümanı olmayan uid'ler.
const rescued = new Set();

/**
 * "Bu uid silinmiş mi?" sorusunu İKİ kaynağa sorar.
 *
 * users dokümanının yokluğu tek başına yeterli değil: kayıt sırasında Auth
 * hesabı oluşup users yazımı başarısız olan kullanıcı da öyle görünür ve
 * içeriği yanlışlıkla silinir. Script haftalık cron'da gözetimsiz çalıştığı
 * için Auth'a da soruyoruz — silme geri alınamaz.
 */
async function isLive(uid) {
  if (!uid) return false;
  if (existingUsers.has(uid) || rescued.has(uid)) return true;
  try {
    await auth.getUser(uid);
    console.log(`[uyarı] ${uid}: Auth'ta var ama users dokümanı yok — dokunulmuyor.`);
    rescued.add(uid);
    return true;
  } catch {
    return false; // auth/user-not-found → gerçekten silinmiş
  }
}

async function fixIfDrifted(ref, field, actual, label) {
  const doc = await ref.get();
  const stored = doc.data()?.[field] || 0;
  if (stored !== actual) {
    console.log(`[düzeltme] ${label} ${ref.path}.${field}: ${stored} → ${actual}`);
    if (!DRY_RUN) await ref.update({ [field]: actual });
    return 1;
  }
  return 0;
}

async function prune(ref, why) {
  console.log(`[budama] ${ref.path} (${why})`);
  if (!DRY_RUN) await db.recursiveDelete(ref).catch(() => {});
}

/** Beğeni alt koleksiyonunu budar, canlı beğeni sayısını döner. */
async function liveLikes(likesRef) {
  const snap = await likesRef.get();
  let live = 0;
  for (const d of snap.docs) {
    // Doküman id'si == beğenen kullanıcının uid'i (userId alanı da yazılır).
    if (await isLive(d.data()?.userId || d.id)) { live++; continue; }
    await prune(d.ref, 'silinmiş kullanıcı');
  }
  return live;
}

/**
 * Hikâye yorumlarını budar, canlı yorum sayısını döner. Silinmiş kullanıcının
 * yorumuna gelen yanıtlar da gider — istemcideki deleteComment ile aynı
 * davranış (yetim yanıt arayüzde görünmez ama sayaçta durur).
 */
async function liveComments(commentsRef) {
  const snap = await commentsRef.get();
  const dead = new Set();
  for (const d of snap.docs) {
    if (!(await isLive(d.data()?.userId))) dead.add(d.id);
  }
  let live = 0;
  for (const d of snap.docs) {
    if (dead.has(d.id)) { await prune(d.ref, 'silinmiş kullanıcı'); continue; }
    if (dead.has(d.data()?.parentId)) { await prune(d.ref, 'silinmiş yoruma yanıt'); continue; }
    await fixIfDrifted(d.ref, 'likesCount', await liveLikes(d.ref.collection('likes')), 'yorum');
    live++;
  }
  return live;
}

/** Konuşma yorumları hikâyeninkinden farklı: top-level koleksiyonda durur. */
async function liveConversationComments(conversationId) {
  const snap = await db.collection('conversationComments')
    .where('conversationId', '==', conversationId)
    .get();
  let live = 0;
  for (const d of snap.docs) {
    if (await isLive(d.data()?.userId)) { live++; continue; }
    await prune(d.ref, 'silinmiş kullanıcı');
  }
  return live;
}

async function reconcileStories() {
  const stories = await db.collection('stories').get();
  let fixed = 0;

  for (const storyDoc of stories.docs) {
    const ref = storyDoc.ref;
    fixed += await fixIfDrifted(ref, 'likesCount', await liveLikes(ref.collection('likes')), 'hikaye');
    fixed += await fixIfDrifted(ref, 'commentsCount', await liveComments(ref.collection('comments')), 'hikaye');

    // viewsCount toplam görüntülenmedir (benzersiz kullanıcı değil) —
    // views/{userId} dokümanlarındaki count alanlarının toplamı.
    const viewsSnap = await ref.collection('views').get();
    const totalViews = viewsSnap.docs.reduce((sum, d) => sum + (d.data().count || 0), 0);
    fixed += await fixIfDrifted(ref, 'viewsCount', totalViews, 'hikaye');

    // Bölüm-bazlı beğeniler (bkz. YAPILACAKLAR 2.3)
    const chapters = await ref.collection('chapters').get();
    for (const chapterDoc of chapters.docs) {
      fixed += await fixIfDrifted(
        chapterDoc.ref,
        'likesCount',
        await liveLikes(chapterDoc.ref.collection('likes')),
        'bölüm'
      );
    }
  }
  return fixed;
}

async function reconcileConversations() {
  const conversations = await db.collection('conversations').get();
  let fixed = 0;
  for (const doc of conversations.docs) {
    fixed += await fixIfDrifted(doc.ref, 'likesCount', await liveLikes(doc.ref.collection('likes')), 'konuşma');
    fixed += await fixIfDrifted(
      doc.ref,
      'commentsCount',
      await liveConversationComments(doc.id),
      'konuşma'
    );
  }
  return fixed;
}

async function reconcileUsers(userDocs) {
  let fixed = 0;
  for (const doc of userDocs) {
    for (const sub of ['followers', 'following']) {
      const snap = await doc.ref.collection(sub).get();
      let live = 0;
      for (const rel of snap.docs) {
        // Doc id == karşı kullanıcının uid'i (followers/{takipçi},
        // following/{takip edilen}).
        if (await isLive(rel.id)) { live++; continue; }
        console.log(`[budama] ${doc.ref.path}/${sub}/${rel.id} (silinmiş kullanıcı)`);
        if (!DRY_RUN) await rel.ref.delete().catch(() => {});
      }
      const field = sub === 'followers' ? 'followersCount' : 'followingCount';
      fixed += await fixIfDrifted(doc.ref, field, live, 'kullanıcı');
    }
  }
  return fixed;
}

async function main() {
  console.log(DRY_RUN ? 'DRY RUN — hiçbir şey yazılmayacak.' : 'Sayaç düzeltme başlıyor...');
  // Hayalet ayıklama bu kümeye dayandığı için ilk iş kullanıcıları okumak.
  const users = await db.collection('users').get();
  existingUsers = new Set(users.docs.map((d) => d.id));

  const storiesFixed = await reconcileStories();
  const conversationsFixed = await reconcileConversations();
  const usersFixed = await reconcileUsers(users.docs);
  console.log(`\nBitti. Düzeltilen sayaç: ${storiesFixed + conversationsFixed + usersFixed}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Sayaç düzeltme başarısız:', error);
    process.exit(1);
  });
