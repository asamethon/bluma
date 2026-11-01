const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Yerel emülatör dışında çalışmaz; yalnızca bu koşunun geçici belgelerini kullanır.
const host = process.env.FIRESTORE_EMULATOR_HOST;
const projectId = process.env.GCLOUD_PROJECT;
if (!/^127\.0\.0\.1:\d+$/.test(host || '') || !projectId?.startsWith('demo-')) {
  throw new Error('Yerel demo Firestore emülatörü gerekir.');
}
const app = initializeApp({ projectId });
const db = getFirestore(app);
const prefix = `projects/${projectId}/databases/(default)/documents`;
const base = `http://${host}/v1/${prefix}`;
const runId = `counters-${Date.now()}`;
const owner = `${runId}-owner`;
const stranger = `${runId}-stranger`;
const paths = [];

function token(uid) {
  const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: uid, user_id: uid,
    aud: projectId, iss: `https://securetoken.google.com/${projectId}`, iat: now, exp: now + 3600,
    email_verified: true, firebase: { sign_in_provider: 'password' },
  })}.`;
}
const value = data => (typeof data === 'number' ? { integerValue: String(data) }
  : typeof data === 'boolean' ? { booleanValue: data } : { stringValue: data });
const fields = data => Object.fromEntries(Object.entries(data).map(([key, item]) => [key, value(item)]));

async function write(path, data, uid) {
  const response = await fetch(`${base}:commit`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(uid)}` },
    body: JSON.stringify({ writes: [{ update: { name: `${prefix}/${path}`, fields: fields(data) },
      updateMask: { fieldPaths: Object.keys(data) } }] }) });
  return response.status;
}
const expectStatus = async (path, data, uid, status, message) => {
  assert.equal(await write(path, data, uid), status, message);
};

async function freshStory(data = {}) {
  const path = `stories/${runId}-${paths.length}`;
  paths.push(path);
  await db.doc(path).set({ authorId: owner, title: 'Sayaç', isPublished: true,
    likesCount: 20, commentsCount: 8, viewsCount: 100, ...data });
  return path;
}

before(() => db.doc(`users/${stranger}`).set({ username: 'yabanci', followersCount: 40 }));
after(async () => {
  await Promise.all([...paths, `users/${stranger}`].map(path => db.recursiveDelete(db.doc(path))));
  await deleteApp(app);
});

test('yabancı kullanıcı hikâyenin beğeni sayacını sıfırlayamaz', async () => {
  const path = await freshStory();
  await expectStatus(path, { likesCount: 0 }, stranger, 403);
  await expectStatus(path, { likesCount: 5 }, stranger, 403);
});

test('beğeni sayacı tek adım oynayabilir', async () => {
  const path = await freshStory();
  await db.doc(`${path}/likes/${stranger}`).set({ userId: stranger });
  await expectStatus(path, { likesCount: 21 }, stranger, 200, 'beğenme +1');
  await expectStatus(path, { likesCount: 20 }, stranger, 200, 'beğeniyi geri alma -1');
});

test('yorum sayacı toplu azaltılamaz, tek tek azaltılır', async () => {
  const path = await freshStory();
  await expectStatus(path, { commentsCount: 3 }, owner, 403, 'toplu -5 reddedilmeli');
  await expectStatus(path, { commentsCount: 7 }, owner, 200, 'tek adım -1 kabul edilmeli');
});

test('görüntülenme sayacı keyfi düşürülemez', async () => {
  const path = await freshStory();
  await expectStatus(path, { viewsCount: 0 }, stranger, 403);
});

test('takipçi sayacı sıfırlanamaz', async () => {
  await expectStatus(`users/${stranger}`, { followersCount: 0 }, owner, 403);
});

test('yazar kendi hikâyesinin sayaçlarını şişiremez ama içeriği düzenleyebilir', async () => {
  const path = await freshStory();
  await expectStatus(path, { likesCount: 500 }, owner, 403, 'beğeni şişirme');
  await expectStatus(path, { viewsCount: 9999 }, owner, 403, 'görüntülenme şişirme');
  await expectStatus(path, { title: 'Yeni Başlık' }, owner, 200, 'içerik düzenleme serbest');
});

test('kullanıcı kendi takipçi sayısını yazamaz, hikâye sayacı tek adım oynar', async () => {
  await expectStatus(`users/${stranger}`, { followersCount: 999 }, stranger, 403, 'takipçi şişirme');
  await expectStatus(`users/${stranger}`, { storiesCount: 1 }, stranger, 200, 'yayınlamada +1');
  await expectStatus(`users/${stranger}`, { bio: 'Merhaba' }, stranger, 200, 'profil düzenleme serbest');
});

test('yorum sahibi yorumu başkasının üstüne yıkamaz', async () => {
  const path = await freshStory();
  const comment = `${path}/comments/yorum`;
  await db.doc(comment).set({ storyId: path, userId: owner, content: 'Merhaba',
    likesCount: 0, isEdited: false });
  await expectStatus(comment, { userId: stranger }, owner, 403, 'userId değiştirilemez');
  await expectStatus(comment, { content: 'Düzeltildi', isEdited: true }, owner, 200, 'kendi metnini düzenleyebilir');
  await expectStatus(comment, { content: 'Başkasının yorumu' }, stranger, 403, 'yabancı metni değiştiremez');
});
