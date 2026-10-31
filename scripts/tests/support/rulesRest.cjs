const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

/**
 * Kural testleri için ortak REST istemcisi. İstekler emülatöre gerçek bir
 * istemci gibi (imzasız sahte token ile) gider; kurulum/temizlik ise
 * kurallara tabi olmayan Admin SDK ile yapılır.
 */
function createRulesClient(label) {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const projectId = process.env.GCLOUD_PROJECT;
  if (!/^127\.0\.0\.1:\d+$/.test(host || '') || !projectId?.startsWith('demo-')) {
    throw new Error('Yerel demo Firestore emülatörü gerekir.');
  }
  const app = initializeApp({ projectId }, `${label}-${Date.now()}`);
  const db = getFirestore(app);
  const prefix = `projects/${projectId}/databases/(default)/documents`;
  const base = `http://${host}/v1/${prefix}`;
  const runId = `${label}-${Date.now()}`;

  function token(uid, claims = {}) {
    const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: uid, user_id: uid,
      aud: projectId, iss: `https://securetoken.google.com/${projectId}`, iat: now, exp: now + 3600,
      email_verified: true, firebase: { sign_in_provider: 'password' }, ...claims,
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
  /** Yalnızca verilen alanları yazar (merge); `removed` alanları siler. */
  const update = (path, data, removed = []) => ({ update: { name: `${prefix}/${path}`, fields: fields(data) },
    updateMask: { fieldPaths: [...Object.keys(data), ...removed] } });
  /** Belge yoksa oluşturur (create kuralı), varsa reddedilir. */
  const create = (path, data) => ({ update: { name: `${prefix}/${path}`, fields: fields(data) },
    currentDocument: { exists: false } });
  const increment = (path, field, by = 1) => ({ transform: { document: `${prefix}/${path}`,
    fieldTransforms: [{ fieldPath: field, increment: { integerValue: String(by) } }] } });
  const arrayUnion = (path, field, items) => ({ transform: { document: `${prefix}/${path}`,
    fieldTransforms: [{ fieldPath: field, appendMissingElements: { values: items.map(value) } }] } });
  /**
   * İstemci transaction'ının ürettiği tek yazım: düz alanlar + dönüşümler
   * (`{ inc: n }` atomik artış, `{ union: [...] }` arrayUnion) birlikte.
   */
  function patch(path, data = {}, transforms = {}) {
    return {
      update: { name: `${prefix}/${path}`, fields: fields(data) },
      // Düz alanlar üst düzeydir; iç içe alanlar (ör. challengeProgress.c1)
      // dönüşümlerle yazılır — dönüşüm yolu noktalı olabilir.
      updateMask: { fieldPaths: Object.keys(data) },
      updateTransforms: Object.entries(transforms).map(([fieldPath, op]) => ('inc' in op
        ? { fieldPath, increment: { integerValue: String(op.inc) } }
        : { fieldPath, appendMissingElements: { values: op.union.map(value) } })),
    };
  }

  async function commit(writes, uid, claims) {
    const response = await fetch(`${base}:commit`, { method: 'POST',
      headers: { 'Content-Type': 'application/json',
        ...(uid ? { Authorization: `Bearer ${token(uid, claims)}` } : {}) },
      body: JSON.stringify({ writes }),
    });
    return { status: response.status, body: await response.json() };
  }
  /** `uid` null ise oturumsuz istek. */
  async function expectStatus(writes, status, uid, claims) {
    const result = await commit(writes, uid, claims);
    assert.equal(result.status, status, JSON.stringify(result.body));
  }

  const created = [];
  async function seed(path, data) {
    created.push(path);
    await db.doc(path).set(data);
    return path;
  }
  async function cleanup() {
    await Promise.all(created.map(path => db.recursiveDelete(db.doc(path))));
    await deleteApp(app);
  }

  return { db, runId, update, create, increment, arrayUnion, patch, expectStatus, seed, cleanup,
    track: path => { created.push(path); return path; } };
}

module.exports = { createRulesClient };
