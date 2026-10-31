const assert = require('node:assert/strict');
const { legacyClientsRetired } = require('../challengeRewards.cjs');
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
const runId = `xp-${Date.now()}`;
const owner = `${runId}-owner`;
const other = `${runId}-other`;
const paths = [];

function token(uid) {
  const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: uid, user_id: uid,
    aud: projectId, iss: `https://securetoken.google.com/${projectId}`, iat: now, exp: now + 3600,
    email_verified: true, firebase: { sign_in_provider: 'password' },
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
const update = (path, data) => ({ update: { name: `${prefix}/${path}`, fields: fields(data) },
  updateMask: { fieldPaths: Object.keys(data) } });
async function commit(writes, uid) {
  const response = await fetch(`${base}:commit`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(uid ? { Authorization: `Bearer ${token(uid)}` } : {}) },
    body: JSON.stringify({ writes }),
  });
  return { status: response.status, body: await response.json() };
}
// Kısıtlar yalnızca eski sürüm emekliye ayrıldığında yürürlükte; geçiş
// döneminde aynı yazma kabul edilir. Bkz. firestore.rules legacyClientsRetired.
const strict = legacyClientsRetired();
const BLOCKED = strict ? 403 : 200;

async function expectStatus(writes, status, uid = owner) {
  const result = await commit(writes, uid);
  assert.equal(result.status, status, JSON.stringify(result.body));
}

// Her test kendi belgesiyle çalışır; XP başlangıcı 100.
async function freshUser(data = {}) {
  const path = `users/${runId}-${paths.length}`;
  paths.push(path);
  await db.doc(path).set({ username: 'okur', xp: 100, streak: 2, lastActiveDate: '2026-10-30',
    challengeWeekStart: '2026-10-26', challengeProgress: { r1: 5, c1: 1 }, claimedChallenges: [], ...data });
  return path;
}
// Kuralda sahiplik kontrolü belge kimliğine bakar; sahibi test eden yollar
// gerçek uid'yi kullanır.
async function ownUser(data = {}) {
  const path = `users/${owner}`;
  if (!paths.includes(path)) paths.push(path);
  await db.doc(path).set({ username: 'okur', xp: 100, streak: 2, lastActiveDate: '2026-10-30',
    challengeWeekStart: '2026-10-26', challengeProgress: { r1: 5, c1: 1 }, claimedChallenges: [], ...data });
  return path;
}

before(() => db.doc(`users/${other}`).set({ username: 'yazar', xp: 0 }));
after(async () => {
  await Promise.all([...paths, `users/${other}`].map(path => db.recursiveDelete(db.doc(path))));
  await deleteApp(app);
});

test('keyfi XP yazımı reddedilir', async () => {
  const path = await ownUser();
  await expectStatus([update(path, { xp: 999999 })], BLOCKED);
});

test('tanımlı ödüle karşılık gelmeyen artış reddedilir', async () => {
  const path = await ownUser();
  await expectStatus([update(path, { xp: 155 })], BLOCKED);
});

test('XP düşürülemez', async () => {
  const path = await ownUser();
  await expectStatus([update(path, { xp: 50 })], BLOCKED);
});

test('görev ödülü kadar artış kabul edilir', async () => {
  const path = await ownUser();
  await expectStatus([update(path, { xp: 180 })], 200); // +80 = r1
});

test('hafta sonu ödülü kadar artış kabul edilir', async () => {
  const path = await ownUser();
  await expectStatus([update(path, { xp: 350 })], 200); // +250 = weekly_marathon
});

test('gerçek ödül alma yazımı (XP + ilerleme + alınmış ödül) kabul edilir', async () => {
  const path = await ownUser();
  await expectStatus([update(path, { xp: 190, claimedChallenges: ['c1'],
    challengeProgress: { r1: 5, c1: 5 } })], 200); // +90 = c1
});

test('XP alanına dokunmayan profil güncellemesi kabul edilir', async () => {
  const path = await ownUser();
  await expectStatus([update(path, { bio: 'Merhaba' })], 200);
});

test('görev ilerlemesi ve seri yazımı XP olmadan kabul edilir', async () => {
  const path = await ownUser();
  await expectStatus([update(path, { streak: 3, lastActiveDate: '2026-10-31',
    challengeProgress: { r1: 6, c1: 1 } })], 200);
});

test('başka kullanıcının XP alanı yazılamaz', async () => {
  const path = await freshUser();
  await expectStatus([update(path, { xp: 180 })], 403);
});

// İstemci XP'yi increment() ile yazıyor; JS sayısı ondalık olarak gidebiliyor.
test('ondalık gelen ödül artışı da kabul edilir', async () => {
  const path = await ownUser();
  await expectStatus([{ update: { name: `${prefix}/${path}`, fields: { xp: { doubleValue: 190 } } },
    updateMask: { fieldPaths: ['xp'] } }], 200); // +90 = c1, ondalık
});

test('ondalık ama tanımsız miktar reddedilir', async () => {
  const path = await ownUser();
  await expectStatus([{ update: { name: `${prefix}/${path}`, fields: { xp: { doubleValue: 155.5 } } },
    updateMask: { fieldPaths: ['xp'] } }], BLOCKED);
});

test('XP alanı hiç olmayan eski hesapta ödül kadar artış kabul edilir', async () => {
  const path = `users/${owner}`;
  if (!paths.includes(path)) paths.push(path);
  await db.doc(path).set({ username: 'okur', claimedChallenges: [] });
  await expectStatus([update(path, { xp: 100 })], 200); // 0 → 100 = w4/r4
});
