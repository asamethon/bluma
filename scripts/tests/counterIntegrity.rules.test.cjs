const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { createRulesClient } = require('./support/rulesRest.cjs');

// Sayaçlar, yazarlık ve editoryal işaretler: sahibi dahil kimse doğrudan
// değer yazamaz; meşru akışlar (atomik bump, içerik düzenleme) çalışır.
const c = createRulesClient('counters');
const writer = `${c.runId}-writer`;
const reader = `${c.runId}-reader`;
const admin = [`${c.runId}-admin`, { admin: true }];
after(() => c.cleanup());

const storyBase = { authorId: writer, title: 'Başlık', isPublished: true,
  likesCount: 4, commentsCount: 2, viewsCount: 9 };
let counter = 0;
const next = kind => `${kind}/${c.runId}-${++counter}`;

test('kullanıcı kendi sayaçlarına değer yazamaz; profil düzenlemesi çalışır', async () => {
  const path = await c.seed(`users/${writer}`, { displayName: 'Yazar',
    followersCount: 5, followingCount: 2, storiesCount: 1 });
  for (const field of ['followersCount', 'followingCount', 'storiesCount']) {
    await c.expectStatus([c.update(path, { [field]: 999 })], 403, writer);
    await c.expectStatus([c.update(path, { bio: 'Yeni', [field]: 0 })], 403, writer);
  }
  await c.expectStatus([c.update(path, { bio: 'Yeni biyografi', website: 'https://ornek.com' })], 200, writer);
  // Takip ve yayın akışlarının atomik adımları.
  await c.expectStatus([c.increment(path, 'followingCount')], 200, writer);
  await c.expectStatus([c.increment(path, 'storiesCount')], 200, writer);
  await c.expectStatus([c.increment(path, 'storiesCount', -1)], 200, writer);
  await c.expectStatus([c.increment(path, 'followersCount')], 200, reader);
  await c.expectStatus([c.increment(path, 'storiesCount', 5)], 403, writer);
  const saved = (await c.db.doc(path).get()).data();
  assert.deepEqual([saved.followersCount, saved.followingCount, saved.storiesCount], [6, 3, 1]);
});

test('yeni profil şişirilmiş sayaçla oluşturulamaz', async () => {
  const fresh = `${c.runId}-fresh`;
  await c.expectStatus([c.create(c.track(`users/${fresh}`), { displayName: 'Yeni', followersCount: 50 })], 403, fresh);
  await c.expectStatus([c.create(`users/${fresh}`, { displayName: 'Yeni', authProvider: 'email' })], 200, fresh);
});

test('yazar hikâye sayaçlarını, yazarlığı ve premium işaretini değiştiremez', async () => {
  const path = await c.seed(next('stories'), storyBase);
  for (const data of [{ likesCount: 999 }, { commentsCount: 0 }, { viewsCount: 1 },
    { authorId: reader }, { isPremium: true }, { title: 'Yeni', likesCount: 5 }]) {
    await c.expectStatus([c.update(path, data)], 403, writer);
  }
  await c.expectStatus([c.update(path, { title: 'Düzenlendi', description: 'Açıklama' })], 200, writer);
  // Yazar da bir okur gibi görüntülenme ekleyebilir.
  await c.expectStatus([c.increment(path, 'viewsCount')], 200, writer);
  await c.expectStatus([c.increment(path, 'likesCount')], 200, reader);
  const saved = (await c.db.doc(path).get()).data();
  assert.deepEqual([saved.likesCount, saved.viewsCount, saved.authorId, saved.isPremium],
    [5, 10, writer, undefined]);
});

test('kimse başkasının sayaçlarını tek yazımla sıfırlayamaz', async () => {
  const path = await c.seed(next('stories'), storyBase);
  for (const data of [{ commentsCount: 0 }, { likesCount: 0 }, { viewsCount: 8 }]) {
    await c.expectStatus([c.update(path, data)], 403, reader);
  }
  await c.expectStatus([c.increment(path, 'likesCount', -2)], 403, reader);
  await c.expectStatus([c.increment(path, 'viewsCount', -1)], 403, reader);
  // Beğeniyi geri alma ve yorum silme tek adımdır.
  await c.expectStatus([c.increment(path, 'likesCount', -1)], 200, reader);
  await c.expectStatus([c.increment(path, 'commentsCount', -1)], 200, reader);
  const empty = await c.seed(next('stories'), { ...storyBase, likesCount: 0 });
  await c.expectStatus([c.increment(empty, 'likesCount', -1)], 403, reader);
});

test('yorum sahibi beğeni almış kendi yorumunu temizleyip silebilir', async () => {
  const story = await c.seed(next('stories'), storyBase);
  const comment = await c.seed(`${story}/comments/liked`, { userId: reader, content: 'Beğenilen', likesCount: 1 });
  const like = await c.seed(`${comment}/likes/${writer}`, { userId: writer });
  const stranger = `${c.runId}-stranger`;
  await c.expectStatus([{ delete: `${c.update(like, {}).update.name}` }], 403, stranger);
  await c.expectStatus([{ delete: `${c.update(like, {}).update.name}` }], 200, reader);
  await c.expectStatus([{ delete: `${c.update(comment, {}).update.name}` }], 200, reader);
});

test('premium işaretini yalnız admin verir; hikâye şişirilmiş doğamaz', async () => {
  const path = await c.seed(next('stories'), storyBase);
  await c.expectStatus([c.update(path, { isPremium: true })], 200, ...admin);
  await c.expectStatus([c.update(path, { isPremium: 'evet' })], 403, ...admin);
  for (const data of [{ likesCount: 3 }, { viewsCount: 1 }, { isPremium: true }]) {
    await c.expectStatus([c.create(c.track(next('stories')), { authorId: writer, title: 'Yeni',
      isPublished: false, ...data })], 403, writer);
  }
  await c.expectStatus([c.create(c.track(next('stories')), { authorId: writer, title: 'Yeni',
    isPublished: false, likesCount: 0, commentsCount: 0, viewsCount: 0, isPremium: false })], 200, writer);
});

test('bölüm beğeni sayacı yazara da yalnız bump olarak açıktır', async () => {
  const story = await c.seed(next('stories'), storyBase);
  const chapter = await c.seed(`${story}/chapters/0`, { title: 'B', content: 'Metin', likesCount: 1 });
  await c.expectStatus([c.update(chapter, { likesCount: 500 })], 403, writer);
  await c.expectStatus([c.update(chapter, { content: 'Düzeltilmiş' })], 200, writer);
  await c.expectStatus([c.increment(chapter, 'likesCount')], 200, reader);
  await c.expectStatus([c.create(`${story}/chapters/1`, { title: 'B2', content: 'M', likesCount: 9 })], 403, writer);
  await c.expectStatus([c.create(`${story}/chapters/1`, { title: 'B2', content: 'M' })], 200, writer);
});

test('yorum sahibi yorumu başkasına mal edemez ve beğeniyi şişiremez', async () => {
  const story = await c.seed(next('stories'), storyBase);
  const comment = await c.seed(`${story}/comments/one`, { userId: reader, content: 'Güzel', likesCount: 0 });
  await c.expectStatus([c.update(comment, { userId: writer })], 403, reader);
  await c.expectStatus([c.update(comment, { likesCount: 40 })], 403, reader);
  await c.expectStatus([c.increment(comment, 'likesCount')], 200, writer);
  await c.expectStatus([c.create(`${story}/comments/two`, { userId: reader, content: 'X', likesCount: 3 })], 403, reader);
  await c.expectStatus([c.create(`${story}/comments/two`, { userId: reader, content: 'X', likesCount: 0 })], 200, reader);
});

test('duyuru ve duyuru yorumu sayaçları ile sahipliği korunur', async () => {
  const conversation = await c.seed(next('conversations'), { authorId: writer, title: 'Duyuru',
    likesCount: 1, commentsCount: 0, viewsCount: 0 });
  for (const data of [{ likesCount: 99 }, { viewsCount: 99 }, { authorId: reader }]) {
    await c.expectStatus([c.update(conversation, data)], 403, writer);
  }
  await c.expectStatus([c.update(conversation, { title: 'Düzenlendi' })], 200, writer);
  await c.expectStatus([c.increment(conversation, 'likesCount')], 200, reader);
  const comment = await c.seed(next('conversationComments'), { userId: reader, content: 'Y', likesCount: 0 });
  await c.expectStatus([c.update(comment, { userId: writer })], 403, reader);
  await c.expectStatus([c.update(comment, { likesCount: 10 })], 403, reader);
  await c.expectStatus([c.increment(comment, 'likesCount')], 200, writer);
});
