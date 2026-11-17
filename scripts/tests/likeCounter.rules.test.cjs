const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { before, after, test } = require('node:test');

// Beğeni kaydı ve sayaç AYNI commit'te gidiyor (istemci transaction kullanıyor).
// `counterProof` bu yüzden `existsAfter` kullanmalı: `exists` commit öncesine
// bakıp kaydı yokmuş sayıyor ve artış reddediliyordu.
//
// Asıl sınama `legacyClientsRetired()` AÇIKKEN yapılır — kapalıyken kanıt zaten
// aranmıyor. Anahtara dokunulmaz; kural metni yalnızca bu emülatör oturumu için
// değiştirilip yüklenir, sonunda özgün hâline döndürülür.
//
// Çalıştırma:
//   firebase emulators:start --only firestore --project demo-bluma-rules \
//     --config <geçici-config>
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8799 GCLOUD_PROJECT=demo-bluma-rules \
//     node --test scripts/tests/likeCounter.rules.test.cjs

const projectId = process.env.GCLOUD_PROJECT || 'demo-bluma-rules';
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !projectId.startsWith('demo-')) throw new Error('Yalnızca demo Firestore emülatöründe çalıştırılabilir.');
const base = `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;
const rulesEndpoint = `http://${host}/emulator/v1/projects/${projectId}:securityRules`;
const SOURCE = resolve(process.cwd(), 'firestore.rules');
const original = readFileSync(SOURCE, 'utf8');

function token(uid) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    sub: uid, user_id: uid, aud: projectId, iss: `https://securetoken.google.com/${projectId}`,
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true, firebase: { sign_in_provider: 'password' },
  })}.`;
}

async function loadRules(content) {
  const response = await fetch(rulesEndpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content }] } }),
  });
  if (!response.ok) throw new Error(`Kural yüklenemedi: ${response.status} ${await response.text()}`);
}

/** Admin yolu: kurallara tabi olmayan doğrudan yazma (hazırlık için). */
async function seed(path, fields) {
  const response = await fetch(`${base}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`Hazırlık yazması başarısız: ${await response.text()}`);
}

/** Beğeni kaydı + sayaç artışını TEK commit'te gönderir (transaction gibi). */
async function commitLike(uid, { conversationId, remove = false }) {
  const likePath = `projects/${projectId}/databases/(default)/documents/conversations/${conversationId}/likes/${uid}`;
  const conversationPath = `projects/${projectId}/databases/(default)/documents/conversations/${conversationId}`;
  const writes = remove
    ? [
      { delete: likePath },
      { transform: { document: conversationPath, fieldTransforms: [{ fieldPath: 'likesCount', increment: { integerValue: '-1' } }] } },
    ]
    : [
      { update: { name: likePath, fields: { userId: { stringValue: uid } } } },
      { transform: { document: conversationPath, fieldTransforms: [{ fieldPath: 'likesCount', increment: { integerValue: '1' } }] } },
    ];
  const response = await fetch(`http://${host}/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(uid)}` },
    body: JSON.stringify({ writes }),
  });
  return response.status;
}

before(async () => {
  // `legacyClientsRetired` açıkken sınanır: kanıt (existsAfter) gerçekten aranır.
  const strict = original.replace(
    /function legacyClientsRetired\(\) \{\s*return false;\s*\}/,
    'function legacyClientsRetired() {\n      return true;\n    }',
  );
  assert.notEqual(strict, original, 'legacyClientsRetired anahtarı kural metninde bulunamadı.');
  await loadRules(strict);
  await seed('users/alice', { displayName: { stringValue: 'Alice' } });
  await seed('conversations/c1', {
    authorId: { stringValue: 'bob' },
    boardOwnerId: { stringValue: 'bob' },
    likesCount: { integerValue: '0' },
    commentsCount: { integerValue: '0' },
  });
});

after(() => loadRules(original));

test('beğeni kaydı ve sayaç artışı aynı commit\'te kabul edilir', async () => {
  assert.equal(await commitLike('alice', { conversationId: 'c1' }), 200);
});

test('beğeniyi geri alma aynı commit\'te kabul edilir', async () => {
  assert.equal(await commitLike('alice', { conversationId: 'c1', remove: true }), 200);
});

test('kayıt yazmadan tek başına sayaç artışı reddedilir', async () => {
  const conversationPath = `projects/${projectId}/databases/(default)/documents/conversations/c1`;
  const response = await fetch(`http://${host}/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token('mallory')}` },
    body: JSON.stringify({
      writes: [{ transform: { document: conversationPath, fieldTransforms: [{ fieldPath: 'likesCount', increment: { integerValue: '1' } }] } }],
    }),
  });
  assert.equal(response.status, 403);
});
