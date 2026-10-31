const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:8787/v1/projects/demo-bluma-local/databases/(default)/documents';
const storyPath = 'stories/local-smoke-story';
function value(data) {
  if (Array.isArray(data)) return { arrayValue: { values: data.map(value) } };
  if (typeof data === 'boolean') return { booleanValue: data };
  if (typeof data === 'number') return { integerValue: String(data) };
  return { stringValue: data };
}
const fields = data => Object.fromEntries(Object.entries(data).map(([key, item]) => [key, value(item)]));
const update = (path, data) => ({ update: { name: base.slice(base.indexOf('projects/')) + '/' + path, fields: fields(data) },
  updateMask: { fieldPaths: Object.keys(data) } });
async function signIn(email) {
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'BlumaTest123!', returnSecureToken: true }),
  });
  const result = await response.json();
  assert.equal(response.status, 200, `Yerel giriş başarısız: ${email}`);
  const claims = JSON.parse(Buffer.from(result.idToken.split('.')[1], 'base64url').toString());
  assert.equal(claims.aud, 'demo-bluma-local');
  assert.equal(claims.email_verified, true);
  return result.idToken;
}
async function request(path, token, writes) {
  const response = await fetch(writes ? `${base}:commit` : `${base}/${path}`, {
    method: writes ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(writes ? { body: JSON.stringify({ writes }) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
async function main() {
  const [writer, reader] = await Promise.all([signIn('yazar@bluma.test'), signIn('okur@bluma.test')]);
  assert.equal((await request('users/local-writer/private/account', writer)).status, 200);
  assert.equal((await request('users/local-writer/private/account', reader)).status, 403);
  const profile = await request('users/local-writer', reader);
  assert.equal(profile.status, 200);
  assert.equal(Object.hasOwn(profile.data.fields, 'email'), false);
  const created = await request('', writer, [
    update(storyPath, { authorId: 'local-writer', title: 'Geçici bağlantı testi', isPublished: true, chaptersCount: 1 }),
  ]);
  assert.equal(created.status, 200, JSON.stringify(created.data));
  const body = await request('', writer, [update(`${storyPath}/chapters/0`, { title: 'İlk', content: 'Eski yayın', order: 0 })]);
  assert.equal(body.status, 200, JSON.stringify(body.data));
  const saved = await request('', writer, [
    update(`${storyPath}/draftChapters/_meta`, { chaptersCount: 2, chapterTitles: ['İlk', 'Yeni'] }),
    update(`${storyPath}/draftChapters/0`, { title: 'İlk', content: 'Özel düzeltme', order: 0 }),
    update(`${storyPath}/draftChapters/1`, { title: 'Yeni', content: 'Özel yeni bölüm', order: 1 }),
  ]);
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  assert.equal((await request(`${storyPath}/draftChapters/1`, reader)).status, 403);
  assert.equal((await request(`${storyPath}/chapters/0`, reader)).data.fields.content.stringValue, 'Eski yayın');
  assert.equal((await request(storyPath, reader)).data.fields.chaptersCount.integerValue, '1');
  const published = await request('', writer, [
    update(`${storyPath}/chapters/0`, { content: 'Özel düzeltme' }),
    update(`${storyPath}/chapters/1`, { title: 'Yeni', content: 'Özel yeni bölüm', order: 1 }),
    update(storyPath, { chaptersCount: 2, chapterTitles: ['İlk', 'Yeni'] }),
  ]);
  assert.equal(published.status, 200, JSON.stringify(published.data));
  assert.equal((await request(`${storyPath}/chapters/1`, reader)).data.fields.content.stringValue, 'Özel yeni bölüm');
  console.log('PASS: Yerel Auth girişi, özel profil, taslak izolasyonu ve atomik yayın (iki gerçek emülatör oturumu).');
}
async function cleanup() {
  const writer = await signIn('yazar@bluma.test');
  if ((await request(storyPath, writer)).status === 404) return;
  const prefix = base.slice(base.indexOf('projects/'));
  const paths = ['draftChapters/0', 'draftChapters/1', 'draftChapters/_meta', 'chapters/0', 'chapters/1'];
  const result = await request('', writer, [...paths.map(path => ({ delete: `${prefix}/${storyPath}/${path}` })),
    { delete: `${prefix}/${storyPath}` }]);
  assert.equal(result.status, 200);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => cleanup().catch(error => { console.error('Test verisi temizlenemedi:', error.message); process.exitCode = 1; }));
