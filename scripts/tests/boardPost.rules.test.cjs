const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Yazar panosu kuralları (firestore.rules → acceptsBoardPostFrom /
// ownsConversation). Eski istemci uyumluluğu bu paketin ASIL konusudur:
// `boardOwnerId` alanı olmayan create kabul edilmeye devam etmeli.
//
// Çalıştırma:
//   firebase emulators:start --only firestore --project demo-bluma-local \
//     --config firebase.emulators.json
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 GCLOUD_PROJECT=demo-bluma-local \
//     node --test scripts/tests/boardPost.rules.test.cjs

const projectId = process.env.GCLOUD_PROJECT || 'demo-bluma-board';
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
    typeof value === 'boolean' ? { booleanValue: value }
      : typeof value === 'number' ? { integerValue: String(value) }
        : typeof value === 'object' ? { mapValue: { fields: fields(value) } }
          : { stringValue: value },
  ]));
}

/** `mask` verilirse yalnızca o alanlar yazılır (sayaç bump'ı gibi). */
async function write(path, uid, data, mask) {
  const query = mask ? `?${mask.map(field => `updateMask.fieldPaths=${field}`).join('&')}` : '';
  const response = await fetch(`${base}/${path}${query}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(uid ? { Authorization: `Bearer ${token(uid)}` } : {}) },
    body: JSON.stringify({ fields: fields(data) }),
  });
  return response.status;
}

async function remove(path, uid) {
  const response = await fetch(`${base}/${path}`, {
    method: 'DELETE',
    headers: uid ? { Authorization: `Bearer ${token(uid)}` } : {},
  });
  return response.status;
}

/** Yorum silme + sayaç düşüşü TEK batch'te gider (conversationComments.ts). */
async function commitCommentDeletion(uid, { conversationId, commentIds }) {
  const prefix = `projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(`http://${host}/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(uid)}` },
    body: JSON.stringify({
      writes: [
        ...commentIds.map(id => ({ delete: `${prefix}/conversationComments/${id}` })),
        {
          transform: {
            document: `${prefix}/conversations/${conversationId}`,
            fieldTransforms: [
              { fieldPath: 'commentsCount', increment: { integerValue: String(-commentIds.length) } },
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
            ],
          },
        },
      ],
    }),
  });
  return response.status;
}

const post = (authorId, boardOwnerId) => ({
  authorId,
  ...(boardOwnerId ? { boardOwnerId } : {}),
  author: { id: authorId, displayName: 'Yazan' },
  title: '',
  content: 'Panoya bir mesaj',
  isActive: true,
  likesCount: 0,
  commentsCount: 0,
  viewsCount: 0,
});

before(async () => {
  await db.doc('users/samet').set({ displayName: 'Samet' });
  await db.doc('users/ayse').set({ displayName: 'Ayşe' });
  await db.doc('users/isik').set({ displayName: 'Işık' });
  await db.doc('users/kapali').set({ displayName: 'Kapalı', privacy: { boardPosts: 'nobody' } });
  await db.doc('users/takipli').set({ displayName: 'Takipli', privacy: { boardPosts: 'following' } });
  // `following` modu pano SAHİBİNİN takip listesine bakar.
  await db.doc('users/takipli/following/ayse').set({ userId: 'ayse' });
  await db.doc('users/samet/blocked/engelli').set({ userId: 'engelli' });
});
after(() => deleteApp(app));

test('eski istemcinin alansız create\'i kabul edilir', async () => {
  assert.equal(await write('conversations/legacy-1', 'ayse', post('ayse')), 200);
});

test('kendi panosuna yazma her zaman açıktır', async () => {
  assert.equal(await write('conversations/own-1', 'ayse', post('ayse', 'ayse')), 200);
});

test('ayarı olmayan panoya (varsayılan herkes) yazılabilir', async () => {
  assert.equal(await write('conversations/board-1', 'ayse', post('ayse', 'samet')), 200);
});

test("'nobody' ayarı başkasının yazmasını engeller", async () => {
  assert.equal(await write('conversations/board-2', 'ayse', post('ayse', 'kapali')), 403);
});

test("'following' yalnızca pano sahibinin takip ettiğine izin verir", async () => {
  assert.equal(await write('conversations/board-3', 'ayse', post('ayse', 'takipli')), 200);
  assert.equal(await write('conversations/board-4', 'isik', post('isik', 'takipli')), 403);
});

test('engellenen kullanıcı panoya yazamaz', async () => {
  assert.equal(await write('conversations/board-5', 'engelli', post('engelli', 'samet')), 403);
});

test('başkasının adına gönderi bırakılamaz', async () => {
  assert.equal(await write('conversations/board-6', 'isik', post('ayse', 'samet')), 403);
});

test('üçüncü kişi pano gönderisinin beğeni sayacını tek adım artırır', async () => {
  assert.equal(await write('conversations/board-1', 'isik', { likesCount: 1 }, ['likesCount']), 200);
  // Keyfi şişirme reddedilir (tek adım kuralı).
  assert.equal(await write('conversations/board-1', 'isik', { likesCount: 50 }, ['likesCount']), 403);
});

test('boardOwnerId sonradan değiştirilemez (yazarın kendi güncellemesinde de)', async () => {
  assert.equal(await write('conversations/board-1', 'ayse', { content: 'düzeltme' }, ['content']), 200);
  assert.equal(await write('conversations/board-1', 'ayse', { boardOwnerId: 'isik' }, ['boardOwnerId']), 403);
});

test('pano sahibi panosundaki yorumu ve gönderiyi silebilir', async () => {
  await db.doc('conversationComments/c-1').set({ conversationId: 'board-1', userId: 'isik', content: 'yorum' });
  // Üçüncü kişi ne yorumu ne gönderiyi silebilir.
  assert.equal(await remove('conversations/board-1', 'isik'), 403);
  assert.equal(await remove('conversationComments/c-1', 'kapali'), 403);
  // Pano sahibi: yetki konuşma dokümanından okunuyor, önce yorumlar gider.
  assert.equal(await remove('conversationComments/c-1', 'samet'), 200);
  assert.equal(await remove('conversations/board-1', 'samet'), 200);
});

test('yazan kendi gönderisini başka panodan geri çekebilir', async () => {
  assert.equal(await write('conversations/board-7', 'ayse', post('ayse', 'samet')), 200);
  assert.equal(await remove('conversations/board-7', 'ayse'), 200);
});

test('pano sahibi yorum dalını sayacıyla birlikte tek batch\'te siler', async () => {
  await db.doc('conversations/board-8').set({
    authorId: 'ayse', boardOwnerId: 'samet', content: 'pano', isActive: true,
    likesCount: 0, commentsCount: 2, viewsCount: 0,
  });
  await db.doc('conversationComments/d-1').set({ conversationId: 'board-8', userId: 'isik', content: 'yorum' });
  await db.doc('conversationComments/d-2').set({ conversationId: 'board-8', userId: 'kapali', content: 'yanıt', parentId: 'd-1' });

  // Üçüncü kişi aynı yazmayı yapamaz.
  assert.equal(await commitCommentDeletion('kapali', { conversationId: 'board-8', commentIds: ['d-1'] }), 403);
  // Pano sahibi: yorum + yanıt + sayaç -2.
  assert.equal(await commitCommentDeletion('samet', { conversationId: 'board-8', commentIds: ['d-1', 'd-2'] }), 200);
  assert.equal((await db.doc('conversations/board-8').get()).data().commentsCount, 0);
});

test('yorumu yazan kendi dalını siler', async () => {
  await db.doc('conversations/board-9').set({
    authorId: 'ayse', boardOwnerId: 'samet', content: 'pano', isActive: true,
    likesCount: 0, commentsCount: 1, viewsCount: 0,
  });
  await db.doc('conversationComments/d-3').set({ conversationId: 'board-9', userId: 'isik', content: 'yorum' });
  assert.equal(await commitCommentDeletion('isik', { conversationId: 'board-9', commentIds: ['d-3'] }), 200);
  assert.equal((await db.doc('conversations/board-9').get()).data().commentsCount, 0);
});
