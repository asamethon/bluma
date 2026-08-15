// Sayaç düzeltme cron'u (bkz. YAPILACAKLAR 3.1) — atomik increment() her zaman
// doğru kullanılsa bile ağ kopması / yarım kalan işlem gibi durumlarda sayaçlar
// zamanla gerçek veriden kayabilir. Bu script haftada bir çalışır, gerçek alt
// koleksiyon sayılarını hesaplayıp sapan sayaçları düzeltir.
//
// Kullanım: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node reconcile-counters.js [--dry-run]

// firebase-admin v14+ eski admin.credential.X() / admin.firestore() namespace
// API'sini kaldırdı — modüler alt-yol importları gerekiyor.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DRY_RUN = process.argv.includes('--dry-run');

const app = initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);

async function countDocs(ref) {
  const snap = await ref.count().get();
  return snap.data().count;
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

async function reconcileStories() {
  const stories = await db.collection('stories').get();
  let fixed = 0;

  for (const storyDoc of stories.docs) {
    const ref = storyDoc.ref;
    fixed += await fixIfDrifted(ref, 'likesCount', await countDocs(ref.collection('likes')), 'hikaye');
    fixed += await fixIfDrifted(ref, 'commentsCount', await countDocs(ref.collection('comments')), 'hikaye');

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
        await countDocs(chapterDoc.ref.collection('likes')),
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
    fixed += await fixIfDrifted(doc.ref, 'likesCount', await countDocs(doc.ref.collection('likes')), 'konuşma');
  }
  return fixed;
}

async function reconcileUsers() {
  const users = await db.collection('users').get();
  // Var olan kullanıcı ID kümesi — silinmiş kullanıcıya işaret eden hayalet
  // takip dokümanlarını (followers/{silinen} veya following/{silinen})
  // ayıklamak için. Bu dokümanlar silme akışı düzeltilmeden önce oluştuysa
  // sayacı şişirmeye devam ederdi; burada budayıp sayacı canlı sayıya çekeriz.
  const existing = new Set(users.docs.map((d) => d.id));
  let fixed = 0;
  for (const doc of users.docs) {
    for (const sub of ['followers', 'following']) {
      const snap = await doc.ref.collection(sub).get();
      let live = 0;
      for (const rel of snap.docs) {
        // Doc id == karşı kullanıcının uid'i (followers/{takipçi},
        // following/{takip edilen}).
        if (existing.has(rel.id)) { live++; continue; }
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
  const storiesFixed = await reconcileStories();
  const conversationsFixed = await reconcileConversations();
  const usersFixed = await reconcileUsers();
  console.log(`\nBitti. Düzeltilen sayaç: ${storiesFixed + conversationsFixed + usersFixed}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Sayaç düzeltme başarısız:', error);
    process.exit(1);
  });
