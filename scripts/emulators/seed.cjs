const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const projectId = 'demo-bluma-local';
// Bu betik canlı Firebase adresine veya farklı projeye yönlendirilemez.
for (const [key, expected] of Object.entries({
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8787', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
})) {
  if (process.env[key] && process.env[key] !== expected) throw new Error(`Beklenmeyen emülatör adresi: ${key}`);
  process.env[key] = expected;
}
if (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== projectId) throw new Error('Yalnızca yerel demo projesi kullanılabilir.');
const app = initializeApp({ projectId });
const db = getFirestore(app);
const password = 'BlumaTest123!';
const accounts = [
  { uid: 'local-writer', email: 'yazar@bluma.test', displayName: 'Yerel Yazar', username: 'yerel_yazar' },
  { uid: 'local-reader', email: 'okur@bluma.test', displayName: 'Yerel Okur', username: 'yerel_okur' },
];

async function seedAccount(account) {
  const { uid, email, displayName, username } = account;
  const values = { email, password, displayName, emailVerified: true };
  const existing = await getAuth(app).getUser(uid).catch(error => {
    if (error.code !== 'auth/user-not-found') throw error;
    return null;
  });
  if (existing) await getAuth(app).updateUser(uid, values);
  else await getAuth(app).createUser({ uid, ...values });
  const ref = db.doc(`users/${uid}`);
  if (!(await ref.get()).exists) {
    await ref.set({ displayName, username, authProvider: 'email', bio: 'Yerel test hesabı', interests: ['fantasy'],
      followersCount: uid === 'local-writer' ? 1 : 0, followingCount: uid === 'local-reader' ? 1 : 0,
      storiesCount: uid === 'local-writer' ? 1 : 0, createdAt: FieldValue.serverTimestamp() });
  }
  await ref.collection('private').doc('account').set({ email }, { merge: true });
}

async function main() {
  await Promise.all(accounts.map(seedAccount));
  const story = db.doc('stories/local-published-story');
  if (!(await story.get()).exists) {
    const content = 'Bu bölüm okuyucuların gördüğü ilk sürümdür. Yazar değişikliklerini taslakta saklar. Yayınla düğmesine basılana kadar bu metin aynı kalmalıdır.';
    const batch = db.batch();
    batch.set(story, { authorId: 'local-writer', title: 'Yerel Yayın Testi', description: 'Taslak ve yayın ayrımını denemek için.',
      content: '', category: 'fantasy', tags: [], isPublished: true, isCompleted: false, isPremium: false,
      isBook: false, chaptersInSubcollection: true, chaptersCount: 1, chapterTitles: ['İlk bölüm'],
      chapterWordCounts: [content.split(/\s+/).length], lastNotifiedChapterCount: 1, readingTime: 1,
      likesCount: 0, commentsCount: 0, viewsCount: 0, language: 'tr',
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    batch.set(story.collection('chapters').doc('0'), { sourceId: 'local-chapter-one', title: 'İlk bölüm', content,
      order: 0, wordCount: content.split(/\s+/).length, likesCount: 0 });
    await batch.commit();
  }
  await db.doc('users/local-writer/followers/local-reader').set({ userId: 'local-reader', createdAt: FieldValue.serverTimestamp() });
  await db.doc('users/local-reader/following/local-writer').set({ userId: 'local-writer', createdAt: FieldValue.serverTimestamp() });
  console.log('Yerel test verileri hazır. Mevcut hikâye ve taslakların üzerine yazılmadı.');
  accounts.forEach(account => console.log(`${account.email} / ${password}`));
}
main().catch(error => { console.error('Yerel veri hazırlanamadı:', error.message); process.exitCode = 1; })
  .finally(() => deleteApp(app));
