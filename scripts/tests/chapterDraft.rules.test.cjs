const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = process.env.GCLOUD_PROJECT || 'demo-bluma-privacy';
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !projectId.startsWith('demo-')) throw new Error('Yalnızca demo Firestore emülatöründe çalıştırılabilir.');
const app = initializeApp({ projectId });
const db = getFirestore(app);
const prefix = `projects/${projectId}/databases/(default)/documents`;
const base = `http://${host}/v1/${prefix}`;
const uid = 'draft-writer';

function token(userId) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    sub: userId, user_id: userId, aud: projectId, iss: `https://securetoken.google.com/${projectId}`,
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true, firebase: { sign_in_provider: 'password' },
  })}.`;
}
function value(data) {
  if (Array.isArray(data)) return { arrayValue: { values: data.map(value) } };
  if (data === null) return { nullValue: null };
  if (typeof data === 'object') return { mapValue: { fields: fields(data) } };
  if (typeof data === 'number') return { integerValue: String(data) };
  if (typeof data === 'boolean') return { booleanValue: data };
  return { stringValue: data };
}
function fields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, item]) => [key, value(item)]));
}
async function request(path, userId, data, method = data ? 'PATCH' : 'GET') {
  const response = await fetch(`${base}/${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(userId ? { Authorization: `Bearer ${token(userId)}` } : {}) },
    ...(data ? { body: JSON.stringify({ fields: fields(data) }) } : {}),
  });
  return { status: response.status, body: await response.json() };
}
const update = (path, data) => ({
  update: { name: `${prefix}/${path}`, fields: fields(data) }, updateMask: { fieldPaths: Object.keys(data) },
});
async function commit(writes) {
  const response = await fetch(`${base}:commit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(uid)}` },
    body: JSON.stringify({ writes }),
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  await db.doc(`users/${uid}`).set({ displayName: 'Taslak yazarı', storiesCount: 0 });
  await db.doc('users/draft-other').set({ displayName: 'Başka yazar' });
  await db.doc('stories/draft-test').set({ authorId: uid, isPublished: true, chaptersCount: 1, chapterTitles: ['Yayındaki'] });
  await db.doc('stories/draft-test/chapters/0').set({ title: 'Yayındaki', content: 'Okuyucu metni', order: 0 });
  await db.doc('stories/unpublished-test').set({ authorId: uid, isPublished: false, chaptersCount: 1 });
});
after(() => deleteApp(app));

test('yayındaki hikâyenin taslağını yalnızca yazar oluşturur, okur ve listeler', async () => {
  const path = 'stories/draft-test/draftChapters/0';
  const secret = { sourceId: 'chapter-one', title: 'Gizli başlık', content: 'Gizli metin', order: 0 };
  assert.equal((await request(path, uid, secret)).status, 200);
  assert.equal((await request(path, uid)).status, 200);
  assert.equal((await request('stories/draft-test/draftChapters', uid)).status, 200);
  for (const reader of [undefined, 'draft-other']) {
    assert.equal((await request(path, reader)).status, 403);
    assert.equal((await request('stories/draft-test/draftChapters', reader)).status, 403);
    assert.equal((await request(path, reader, { ...secret, content: 'Değiştir' })).status, 403);
    assert.equal((await request('stories/draft-test/draftChapters/foreign', reader, secret)).status, 403);
    assert.equal((await request(path, reader, undefined, 'DELETE')).status, 403);
  }
});

test('özel bölüm özeti sızmaz ve otomatik kayıt okuyucu metnini değiştirmez', async () => {
  const path = 'stories/draft-test/draftChapters/_meta';
  assert.equal((await request(path, uid, { chaptersCount: 2, chapterTitles: ['Gizli başlık', 'Gizli devam'] })).status, 200);
  assert.equal((await request(path)).status, 403);
  assert.equal((await request(path, 'draft-other')).status, 403);
  const story = await request('stories/draft-test');
  const chapter = await request('stories/draft-test/chapters/0');
  assert.equal(story.status, 200);
  assert.equal(story.body.fields.chaptersCount.integerValue, '1');
  assert.equal(chapter.status, 200);
  assert.equal(chapter.body.fields.content.stringValue, 'Okuyucu metni');
  assert.equal(JSON.stringify(story.body).includes('Gizli'), false);
});

test('henüz yayınlanmamış hikâyenin taslağı da yalnızca yazara açıktır', async () => {
  const path = 'stories/unpublished-test/draftChapters/0';
  assert.equal((await request(path, uid, { title: 'Taslak', content: 'Yayımlanmadı', order: 0 })).status, 200);
  assert.equal((await request(path, 'draft-other')).status, 403);
  assert.equal((await request(path)).status, 403);
  assert.equal((await request('stories/missing-parent/draftChapters/0', uid, { content: 'Sahipsiz' })).status, 403);
});

test('ilk açık yayında bölüm, üstveri ve atomik yazar sayacı birlikte kabul edilir', async () => {
  const result = await commit([
    update('stories/unpublished-test/chapters/0', { title: 'İlk yayın', content: 'Tam bölüm', order: 0 }),
    update('stories/unpublished-test', { isPublished: true, chaptersCount: 1, chaptersInSubcollection: true,
      chapterTitles: ['İlk yayın'], chapterWordCounts: [2], lastNotifiedChapterCount: 1 }),
    { transform: { document: `${prefix}/users/${uid}`,
      fieldTransforms: [{ fieldPath: 'storiesCount', increment: { integerValue: '1' } }] } },
  ]);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal((await request('stories/unpublished-test/chapters/0')).body.fields.content.stringValue, 'Tam bölüm');
  assert.equal((await db.doc(`users/${uid}`).get()).data().storiesCount, 1);
});

test('yayının bir yazımı reddedilirse bölüm ve üstveri kısmen değişmez', async () => {
  const result = await commit([
    update('stories/draft-test/chapters/0', { content: 'Başarısız yayın' }),
    update('stories/draft-test', { chaptersCount: 2 }),
    update('users/draft-other', { displayName: 'İzinsiz değişiklik' }),
  ]);
  assert.equal(result.status, 403);
  assert.equal((await request('stories/draft-test/chapters/0')).body.fields.content.stringValue, 'Okuyucu metni');
  assert.equal((await request('stories/draft-test')).body.fields.chaptersCount.integerValue, '1');
});

test('yazar taslağı temizleyebilir; okuyucunun yayına yazması reddedilir', async () => {
  assert.equal((await request('stories/draft-test/draftChapters/0', uid, undefined, 'DELETE')).status, 200);
  assert.equal((await request('stories/draft-test/chapters/0', 'draft-other', { content: 'İzinsiz' })).status, 403);
});
