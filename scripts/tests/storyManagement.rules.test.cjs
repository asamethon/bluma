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
const runId = `management-${Date.now()}`;
const writer = `${runId}-writer`;
const paths = [];
const flags = ['isHidden', 'isEditorsPick'];

function token(uid, admin = false) {
  const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: uid, user_id: uid,
    aud: projectId, iss: `https://securetoken.google.com/${projectId}`, iat: now, exp: now + 3600,
    admin, email_verified: true, firebase: { sign_in_provider: 'password' },
  })}.`;
}
function value(data) {
  if (data === null) return { nullValue: null };
  if (typeof data === 'boolean') return { booleanValue: data };
  if (typeof data === 'number') return { integerValue: String(data) };
  if (Array.isArray(data)) return { arrayValue: { values: data.map(value) } };
  if (typeof data === 'object') return { mapValue: { fields: fields(data) } };
  return { stringValue: data };
}
const fields = data => Object.fromEntries(Object.entries(data).map(([key, item]) => [key, value(item)]));
const update = (path, data, removed = []) => ({ update: { name: `${prefix}/${path}`, fields: fields(data) },
  updateMask: { fieldPaths: [...Object.keys(data), ...removed] } });
async function commit(writes, uid = writer, admin = false) {
  const response = await fetch(`${base}:commit`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(uid ? { Authorization: `Bearer ${token(uid, admin)}` } : {}) },
    body: JSON.stringify({ writes }),
  });
  return { status: response.status, body: await response.json() };
}
async function expectStatus(writes, status, uid = writer, admin = false) {
  const result = await commit(writes, uid, admin);
  assert.equal(result.status, status, JSON.stringify(result.body));
}
function freshPath() { const path = `stories/${runId}-${paths.length}`; paths.push(path); return path; }
async function existing(data = {}) {
  const path = freshPath();
  await db.doc(path).set({ authorId: writer, title: 'Başlangıç', isPublished: true,
    likesCount: 0, commentsCount: 0, viewsCount: 0, ...data });
  return path;
}
before(() => db.doc(`users/${writer}`).set({ admin: true, role: 'admin' }));
after(async () => {
  await Promise.all(paths.map(path => db.recursiveDelete(db.doc(path))));
  await db.doc(`users/${writer}`).delete();
  await deleteApp(app);
});

for (const flag of flags) {
  test(`oluşturmada ${flag} yalnız eksik veya false olabilir`, async () => {
    for (const data of [{}, { [flag]: false }]) {
      await expectStatus([update(freshPath(), { authorId: writer, isPublished: false, ...data })], 200);
    }
    for (const invalid of [true, null, 1, 'true', {}, []]) {
      await expectStatus([update(freshPath(), { authorId: writer, isPublished: true, [flag]: invalid })], 403);
    }
  });
  test(`yazar ${flag} ekleyemez, değiştiremez veya silemez`, async () => {
    const legacy = await existing();
    await expectStatus([update(legacy, { [flag]: true })], 403);
    await expectStatus([update(legacy, { [flag]: false })], 403);
    const marked = await existing({ [flag]: true });
    for (const data of [{ [flag]: false }, { [flag]: null }, { [flag]: 'true' }, { title: 'Yeni', [flag]: false }]) {
      await expectStatus([update(marked, data)], 403);
    }
    await expectStatus([update(marked, {}, [flag])], 403);
    // Tam belge değiştirme de yönetim alanını silemez.
    await expectStatus([{ update: { name: `${prefix}/${marked}`, fields: fields({ authorId: writer, isPublished: true }) } }], 403);
    assert.equal((await db.doc(marked).get()).data()[flag], true);
  });
  test(`yalnız admin claim'i ${flag} değiştirebilir; içerik yetkisi kazanmaz`, async () => {
    const path = await existing({ [flag]: false });
    for (const uid of [null, `${runId}-reader`, writer]) await expectStatus([update(path, { [flag]: true })], 403, uid);
    await expectStatus([update(path, { [flag]: true })], 200, `${runId}-admin`, true);
    await expectStatus([update(path, { [flag]: false })], 200, writer, true);
    await expectStatus([update(path, { [flag]: 'true' })], 403, writer, true);
    await expectStatus([update(path, { [flag]: true, title: 'İzinsiz' })], 403, `${runId}-admin`, true);
  });
}

test('yazar işaretli ve eski hikâyeyi düzenleyip bölümünü yayımlayabilir', async () => {
  for (const managed of [{}, { isHidden: true, isEditorsPick: true }]) {
    const path = await existing(managed);
    await expectStatus([update(path, { title: 'Düzenlendi', description: 'Yeni açıklama' })], 200);
    await expectStatus([update(`${path}/draftChapters/0`, { title: 'Bölüm', content: 'Özel taslak' })], 200);
    await expectStatus([
      update(`${path}/chapters/0`, { title: 'Bölüm', content: 'Yeni yayın', order: 0 }),
      update(path, { isPublished: true, chaptersCount: 1, chaptersInSubcollection: true,
        chapterTitles: ['Bölüm'], chapterWordCounts: [2], lastNotifiedChapterCount: 1 }),
    ], 200);
    const saved = (await db.doc(path).get()).data();
    for (const flag of flags) assert.equal(saved[flag], managed[flag]);
    assert.equal((await db.doc(`${path}/chapters/0`).get()).data().content, 'Yeni yayın');
  }
});

test('okurun atomik sayaçları çalışır; aynı yazıma yönetim alanı gizlenemez', async () => {
  const path = await existing({ isHidden: false, isEditorsPick: false });
  // likesCount yalnızca kendi like dokümanıyla artırılabilir
  await expectStatus([{ update: { name: `${prefix}/${path}/likes/${runId}-reader`, fields: fields({ userId: `${runId}-reader` }) } }], 200, `${runId}-reader`);
  await expectStatus([{ transform: { document: `${prefix}/${path}`, fieldTransforms: [{ fieldPath: 'likesCount', increment: { integerValue: '1' } }] } }], 200, `${runId}-reader`);
  for (const flag of flags) {
    await expectStatus([update(path, { [flag]: true })], 403, `${runId}-reader`);
  }
  assert.equal((await db.doc(path).get()).data().likesCount, 1);
  // commentsCount ve viewsCount hâlâ atomik bump ile artırılabilir
  for (const field of ['commentsCount', 'viewsCount']) {
    const transform = { transform: { document: `${prefix}/${path}`, fieldTransforms: [{ fieldPath: field, increment: { integerValue: '1' } }] } };
    await expectStatus([transform], 200, `${runId}-reader`);
    for (const flag of flags) {
      await expectStatus([update(path, { [flag]: true }), transform], 403, `${runId}-reader`);
    }
    assert.equal((await db.doc(path).get()).data()[field], 1);
  }
});
