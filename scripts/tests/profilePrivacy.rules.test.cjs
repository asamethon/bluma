const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { PRIVATE_FIELDS, migrateProfile, cleanConversationAuthor } = require('../migratePrivateProfiles.cjs');

const projectId = process.env.GCLOUD_PROJECT || 'demo-bluma-privacy';
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !projectId.startsWith('demo-')) throw new Error('Yalnızca demo Firestore emülatöründe çalıştırılabilir.');
const app = initializeApp({ projectId });
const db = getFirestore(app);
const base = `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;

function token(uid) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    sub: uid, user_id: uid, aud: projectId, iss: `https://securetoken.google.com/${projectId}`,
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true, firebase: { sign_in_provider: 'password' },
  })}.`;
}

function fields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key,
    typeof value === 'object' ? { mapValue: { fields: fields(value) } }
      : typeof value === 'number' ? { integerValue: String(value) }
        : { stringValue: value },
  ]));
}

async function request(path, uid, data) {
  const response = await fetch(`${base}/${path}`, {
    method: data ? 'PATCH' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(uid ? { Authorization: `Bearer ${token(uid)}` } : {}) },
    ...(data ? { body: JSON.stringify({ fields: fields(data) }) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  await db.doc('users/alice').set({ displayName: 'Yazar', username: 'yazar' });
  await db.doc('users/alice/private/account').set({ email: 'private@example.com', signupDeviceModel: 'phone' });
});
after(() => deleteApp(app));

test('temiz profil misafire açıktır; özel alt belge listeye sızmaz', async () => {
  const result = await request('users/alice');
  assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(result.body.fields).sort(), ['displayName', 'username']);
  const list = await request('users');
  assert.equal(list.status, 200);
  assert.equal(JSON.stringify(list.body).includes('private@example.com'), false);
});

test('özel belgeyi yalnızca sahibi okur ve yazar', async () => {
  assert.equal((await request('users/alice/private/account', 'alice')).status, 200);
  assert.equal((await request('users/alice/private/account')).status, 403);
  assert.equal((await request('users/alice/private/account', 'bob')).status, 403);
  assert.equal((await request('users/alice/private', 'bob')).status, 403);
  assert.equal((await request('users/alice/private/account', 'bob', { email: 'stolen@example.com' })).status, 403);
  assert.equal((await request('users/alice/private/account', 'alice', { email: 'current@example.com' })).status, 200);
});

test('sahibi dahil hiçbir istemci özel alanları açık profile yazamaz', async () => {
  for (const field of PRIVATE_FIELDS) {
    assert.equal((await request('users/alice', 'alice', { displayName: 'Yazar', [field]: 'secret' })).status, 403, field);
    const uid = `new-${field}`;
    assert.equal((await request(`users/${uid}`, uid, { displayName: 'Yeni', [field]: 'secret' })).status, 403, field);
  }
  assert.equal((await request('users/alice', 'alice', { displayName: 'Düzenlenen' })).status, 200);
  assert.equal((await request('users/clean-new', 'clean-new', { displayName: 'Yeni' })).status, 200);
});

test('temiz profilde çapraz kullanıcı takipçi sayacı çalışır', async () => {
  const current = (await db.doc('users/alice').get()).data();
  assert.equal((await request('users/alice', 'bob', { ...current, followersCount: 1 })).status, 200);
});

test('profil kaydının silme maskeli batch işlemi yeni ve eski hesapta çalışır', async () => {
  for (const uid of ['batch-new', 'batch-legacy']) {
    if (uid === 'batch-legacy') await db.doc(`users/${uid}`).set({ email: 'old@example.com', signupRegion: 'TR' });
    const name = `${base.slice(base.indexOf('projects/'))}/users/${uid}`;
    const response = await fetch(`${base}:commit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(uid)}` },
      body: JSON.stringify({ writes: [
        { update: { name, fields: fields({ displayName: 'Yazar' }) }, updateMask: { fieldPaths: ['displayName', ...PRIVATE_FIELDS] } },
        { update: { name: `${name}/private/account`, fields: fields({ email: 'current@example.com' }) }, updateMask: { fieldPaths: ['email'] } },
      ] }),
    });
    assert.equal(response.status, 200, JSON.stringify(await response.json()));
    assert.deepEqual((await db.doc(`users/${uid}`).get()).data(), { displayName: 'Yazar' });
    assert.equal((await db.doc(`users/${uid}/private/account`).get()).data().email, 'current@example.com');
  }
});

test('taşıma önizlemesi veri değiştirmez; uygulama atomik ve tekrarlanabilirdir', async () => {
  const ref = db.doc('users/legacy');
  const legacy = { displayName: 'Eski', ...Object.fromEntries(PRIVATE_FIELDS.map(key => [key, `old-${key}`])) };
  await ref.set(legacy);
  await ref.collection('private').doc('account').set({ email: 'new@example.com' });
  assert.equal(await migrateProfile(db, ref, false), true);
  assert.deepEqual((await ref.get()).data(), legacy);
  assert.equal(await migrateProfile(db, ref, true), true);
  assert.deepEqual((await ref.get()).data(), { displayName: 'Eski' });
  const account = (await ref.collection('private').doc('account').get()).data();
  assert.equal(account.email, 'new@example.com');
  assert.equal(account.signupDeviceModel, 'old-signupDeviceModel');
  assert.equal(await migrateProfile(db, ref, true), false);
  assert.equal((await request('users/legacy')).status, 200);
  assert.equal((await request('users/legacy/private/account', 'bob')).status, 403);
});

test('duyurulara gömülü özel alanlar temizlenir ve yeniden yazılamaz', async () => {
  const ref = db.doc('conversations/legacy');
  await ref.set({ authorId: 'alice', content: 'Duyuru', author: { displayName: 'Yazar', email: 'old@example.com' } });
  assert.equal(await cleanConversationAuthor(db, ref, false), true);
  assert.equal((await ref.get()).data().author.email, 'old@example.com');
  assert.equal(await cleanConversationAuthor(db, ref, true), true);
  assert.deepEqual((await ref.get()).data().author, { displayName: 'Yazar' });
  assert.equal(await cleanConversationAuthor(db, ref, true), false);
  for (const field of PRIVATE_FIELDS) {
    const data = { authorId: 'alice', content: 'Duyuru', author: { displayName: 'Yazar', [field]: 'secret' } };
    assert.equal((await request('conversations/legacy', 'alice', data)).status, 403, field);
    assert.equal((await request(`conversations/new-${field}`, 'alice', data)).status, 403, field);
  }
  assert.equal((await request('conversations/legacy', 'alice', { authorId: 'alice', content: 'Temiz', author: { displayName: 'Yazar' } })).status, 200);
});
