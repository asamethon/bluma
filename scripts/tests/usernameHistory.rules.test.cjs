const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Ad değişince eski ad users/{uid}.previousUsernames içinde saklanıyor
// (features/auth/services/profile/profileUpdate.ts). Bu test kuralın o yazmayı
// SAHİBİNE açtığını, BAŞKASINA kapattığını doğrular — firestore.rules'da
// ayrı bir madde yok, sahibin genel update izninden geliyor; sessizce
// daralırsa eski @bahsetmeler kırılır.
const projectId = process.env.GCLOUD_PROJECT || 'demo-bluma-local';
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !projectId.startsWith('demo-')) throw new Error('Yalnızca demo Firestore emülatöründe çalıştırılabilir.');
const app = initializeApp({ projectId }, 'username-history-rules');
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

/** profilePrivacy testindeki kodlayıcının dizi destekleyen hâli. */
function value(input) {
  if (Array.isArray(input)) return { arrayValue: { values: input.map(value) } };
  if (input && typeof input === 'object') return { mapValue: { fields: fields(input) } };
  if (typeof input === 'number') return { integerValue: String(input) };
  return { stringValue: input };
}
function fields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, item]) => [key, value(item)]));
}

async function patch(path, uid, data) {
  const response = await fetch(`${base}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(uid ? { Authorization: `Bearer ${token(uid)}` } : {}) },
    body: JSON.stringify({ fields: fields(data) }),
  });
  return response.status;
}

const PROFILE = { displayName: 'Gökçe Yılmaz', followersCount: 3, followingCount: 2, storiesCount: 1 };

before(async () => {
  await db.doc('users/history-owner').set({ ...PROFILE, username: 'gkeylmaz' });
});
after(async () => {
  await db.doc('users/history-owner').delete().catch(() => {});
  await deleteApp(app);
});

test('sahibi adını değiştirip eskisini geçmişe yazabilir', async () => {
  const renamed = { ...PROFILE, username: 'gokceyilmaz', previousUsernames: ['gkeylmaz'] };
  assert.equal(await patch('users/history-owner', 'history-owner', renamed), 200);
  assert.deepEqual((await db.doc('users/history-owner').get()).data().previousUsernames, ['gkeylmaz']);
});

test('başkası geçmişi yazamaz — eski adı çalıp etiketleri kendine çekemez', async () => {
  const hijack = { ...PROFILE, username: 'gokceyilmaz', previousUsernames: ['baskasinin_adi'] };
  assert.equal(await patch('users/history-owner', 'yabanci', hijack), 403);
  assert.equal(await patch('users/history-owner', null, hijack), 403);
  assert.deepEqual((await db.doc('users/history-owner').get()).data().previousUsernames, ['gkeylmaz']);
});

test('geçmiş herkese açık okunur — eski @bahsetme çözümü buna dayanır', async () => {
  const response = await fetch(`${base}/users/history-owner`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.fields.previousUsernames.arrayValue.values, [{ stringValue: 'gkeylmaz' }]);
});
