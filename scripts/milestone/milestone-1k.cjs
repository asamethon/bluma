// Bluma 1K kutlaması: üye numaraları + `milestones/1k` belgesi.
//
//   node scripts/milestone/milestone-1k.cjs              → kuru çalışma, hiçbir şey yazmaz
//   node scripts/milestone/milestone-1k.cjs --apply      → numaraları yazar, 1000'e ulaşıldıysa kutlamayı açar
//   node scripts/milestone/milestone-1k.cjs --apply --days=10   → kartın kendiliğinden açıldığı süre (vars. 14 gün)
//   node scripts/milestone/milestone-1k.cjs --apply --off       → kutlamayı kapatır (rozetler kalır)
//   --force : üye sayısı 1000'in altındayken de kutlamayı açar (CANLIDA herkese açılır, dikkat)
//
// Yazılan alanlar: users/{uid}.memberNumber (kural gereği istemci yazamaz) ve
// milestones/1k. Tekrar çalıştırmak güvenlidir: var olan numaralar değişmez.
const path = require('path');
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { assignMemberNumbers } = require('./memberNumbers.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const LIMIT = 1000;
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const OFF = args.includes('--off');
const FORCE = args.includes('--force');
const DAYS = Number((args.find(a => a.startsWith('--days=')) || '--days=14').split('=')[1]) || 14;

const keyFile = fs.readdirSync(path.join(ROOT, 'firebase')).find(f => f.includes('adminsdk') && f.endsWith('.json'));
initializeApp({ credential: cert(require(path.join(ROOT, 'firebase', keyFile))) });
const db = getFirestore();
const ms = v => (v && v.toMillis ? v.toMillis() : typeof v === 'number' ? v : v ? Date.parse(v) || 0 : 0);

async function communityStats() {
  const stories = (await db.collection('stories')
    .select('isPublished', 'isPrivate', 'deleted', 'authorId', 'viewsCount').get()).docs.map(d => d.data())
    .filter(s => s.isPublished === true && !s.isPrivate && !s.deleted);
  const comments = (await db.collectionGroup('comments').count().get()).data().count;
  return {
    stories: stories.length,
    writers: new Set(stories.map(s => s.authorId).filter(Boolean)).size,
    reads: stories.reduce((sum, s) => sum + (Number(s.viewsCount) || 0), 0),
    comments,
  };
}

// createdAt'i olmayan (eski) profiller sona düşmesin: Auth hesabının açılış
// tarihi gerçek kayıt sırasını verir. Auth'ta da yoksa sona kalır.
async function fillAuthDates(users) {
  const missing = users.filter(u => !u.createdAt);
  for (let i = 0; i < missing.length; i += 100) {
    const chunk = missing.slice(i, i + 100);
    const { users: found } = await getAuth().getUsers(chunk.map(u => ({ uid: u.id })));
    const byId = new Map(found.map(r => [r.uid, Date.parse(r.metadata.creationTime) || 0]));
    chunk.forEach(u => { u.createdAt = byId.get(u.id) || 0; });
  }
  return missing.length;
}

(async () => {
  const ref = db.collection('milestones').doc('1k');
  if (OFF) {
    if (APPLY) await ref.set({ active: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log(APPLY ? 'Kutlama kapatıldı.' : '[kuru] Kutlama kapatılacaktı. --apply ekle.');
    process.exit(0);
  }

  const snap = await db.collection('users').select('createdAt', 'memberNumber').get();
  const users = snap.docs.map(d => ({ id: d.id, createdAt: ms(d.get('createdAt')), memberNumber: d.get('memberNumber') }));
  await fillAuthDates(users);
  const fresh = assignMemberNumbers(users);
  const noDate = users.filter(u => !u.createdAt).length;
  console.log(`Kullanıcı: ${users.length} | yeni numara: ${fresh.size} | hiç tarihi olmayan: ${noDate}`);
  const preview = [...fresh.entries()].sort((a, b) => a[1] - b[1]);
  console.log('İlk/son atamalar:', preview.slice(0, 3), '…', preview.slice(-3));

  const stats = await communityStats();
  console.log('Topluluk:', stats);
  const reached = users.length >= LIMIT;
  if (!reached) console.log(`Henüz ${users.length}/${LIMIT}. Kutlama ${FORCE ? '--force ile yine de AÇILACAK' : 'açılmayacak'}.`);

  if (!APPLY) {
    console.log('[kuru] Hiçbir şey yazılmadı. Yazmak için --apply ekle.');
    process.exit(0);
  }
  for (let i = 0; i < preview.length; i += 400) {
    const batch = db.batch();
    preview.slice(i, i + 400).forEach(([id, n]) => batch.update(db.collection('users').doc(id), { memberNumber: n }));
    await batch.commit();
  }
  console.log(`${fresh.size} üyeye numara yazıldı.`);

  // Belge her zaman yazılır: kapalıyken de kart `bluma://milestone` ile
  // önizlenebilir, yalnızca kendiliğinden açılmaz. Zaten açıksa süre uzamaz.
  const live = reached || FORCE;
  const current = (await ref.get()).data() || {};
  const alreadyLive = current.active === true;
  await ref.set({
    active: live,
    members: users.length,
    stats,
    ...(live && !alreadyLive ? { endsAt: Timestamp.fromMillis(Date.now() + DAYS * 864e5) } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(live
    ? `milestones/1k AÇIK${alreadyLive ? ' (zaten açıktı, süre korunuyor)' : ` (${DAYS} gün)`}.`
    : 'milestones/1k KAPALI yazıldı: kart yalnızca bluma://milestone ile önizlenir.');
  process.exit(0);
})().catch(e => { console.error('Hata:', e.message); process.exit(1); });
