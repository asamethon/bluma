const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue, FieldPath } = require('firebase-admin/firestore');

// features/auth/services/profilePrivacy.ts ile aynı alanlar (testle doğrulanır).
const PRIVATE_FIELDS = [
  'email', 'appleUserId', 'signupPlatform', 'signupOsVersion',
  'signupAppVersion', 'signupDeviceModel', 'signupLanguage', 'signupRegion',
];
const privateData = data => Object.fromEntries(PRIVATE_FIELDS
  .filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]]));
const deletedFields = keys => Object.fromEntries(keys.map(key => [key, FieldValue.delete()]));

/** Kopyalama + silme tek transaction; yeni özel belgelerdeki değerler korunur. */
async function migrateProfile(db, ref, apply) {
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return false;
    const legacy = privateData(snapshot.data());
    if (!Object.keys(legacy).length) return false;
    if (!apply) return true;
    const account = ref.collection('private').doc('account');
    const existing = await transaction.get(account);
    const missing = Object.fromEntries(Object.entries(legacy)
      .filter(([key]) => !Object.hasOwn(existing.data() || {}, key)));
    if (Object.keys(missing).length) transaction.set(account, missing, { merge: true });
    transaction.update(ref, deletedFields(Object.keys(legacy)));
    return true;
  });
}

/** Eski duyurular, oturum nesnesini author alanına gömüyordu. */
async function cleanConversationAuthor(db, ref, apply) {
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const author = snapshot.data()?.author;
    if (!author || typeof author !== 'object') return false;
    const keys = Object.keys(privateData(author));
    if (!keys.length) return false;
    if (apply) transaction.update(ref, deletedFields(keys.map(key => `author.${key}`)));
    return true;
  });
}

async function migrateCollection(db, name, apply, migrate) {
  const progress = { scanned: 0, changed: 0, cursor: null };
  while (true) {
    const base = db.collection(name).orderBy(FieldPath.documentId()).limit(200);
    const page = await (progress.cursor ? base.startAfter(progress.cursor) : base).get();
    if (page.empty) break;
    for (const item of page.docs) {
      if (await migrate(db, item.ref, apply)) progress.changed += 1;
      progress.scanned += 1;
    }
    progress.cursor = page.docs[page.docs.length - 1];
  }
  // Kimlik, e-posta ve cihaz bilgileri loglanmaz.
  console.log(`${name}: ${progress.scanned} tarandı, ${progress.changed} ${apply ? 'taşındı/temizlendi' : 'değişecek'}.`);
}

async function main() {
  const apply = process.argv.includes('--apply');
  const projectId = process.argv.find(arg => arg.startsWith('--project='))?.slice('--project='.length);
  if (!projectId) throw new Error('--project=<firebase-proje-id> zorunludur. Varsayılan çalışma salt okunurdur.');
  const app = initializeApp({ projectId, credential: applicationDefault() });
  const db = getFirestore(app);
  console.log(apply ? 'Taşıma uygulanıyor.' : 'DRY RUN — hiçbir veri değişmeyecek.');
  await migrateCollection(db, 'users', apply, migrateProfile);
  await migrateCollection(db, 'conversations', apply, cleanConversationAuthor);
}

module.exports = { PRIVATE_FIELDS, migrateProfile, cleanConversationAuthor };
if (require.main === module) {
  main().catch(() => {
    console.error('Taşıma tamamlanamadı. Proje, bağlantı ve Admin SDK yetkilerini kontrol edip tekrar çalıştırın.');
    process.exitCode = 1;
  });
}
