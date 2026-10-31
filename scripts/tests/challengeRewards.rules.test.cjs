const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { createRulesClient } = require('./support/rulesRest.cjs');

// Görev durumu: XP yalnızca tek bir geçerli ödül talebiyle ve en fazla tek
// ödülün değeri kadar artar; haftalık talepler yalnızca hafta başı ilerlerken
// sıfırlanır; takvim geri ya da yarından öteye sarılamaz.
const c = createRulesClient('rewards');
after(() => c.cleanup());

const DAY = 24 * 60 * 60 * 1000;
const key = date => date.toISOString().slice(0, 10);
const now = new Date();
const today = key(now);
const yesterday = key(new Date(now.getTime() - DAY));
const mondayOf = date => new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * DAY);
const monday = mondayOf(now);
const thisWeek = key(monday);
const lastWeek = key(new Date(monday.getTime() - 7 * DAY));
const twoWeeksAgo = key(new Date(monday.getTime() - 14 * DAY));

let counter = 0;
async function player(data = {}) {
  const uid = `${c.runId}-${++counter}`;
  await c.seed(`users/${uid}`, { displayName: 'Oyuncu', xp: 100, streak: 2,
    lastActiveDate: yesterday, challengeWeekStart: thisWeek,
    challengeProgress: { c1: 5, c4: 1, r1: 2 }, claimedChallenges: ['w3'], weeklyClaims: ['r2'], ...data });
  return { uid, path: `users/${uid}` };
}
const xp = async path => (await c.db.doc(path).get()).data().xp;

test('XP doğrudan ya da ödül talebi olmadan yazılamaz', async () => {
  const { uid, path } = await player();
  await c.expectStatus([c.update(path, { xp: 99999 })], 403, uid);
  await c.expectStatus([c.patch(path, {}, { xp: { inc: 90 } })], 403, uid);
  await c.expectStatus([c.update(path, { bio: 'Yeni', xp: 101 })], 403, uid);
  assert.equal(await xp(path), 100);
});

test('tek geçerli ödül talebi XP verir; sınır, çift talep ve geçersiz kimlik reddedilir', async () => {
  const { uid, path } = await player();
  await c.expectStatus([c.patch(path, {}, { xp: { inc: 301 }, weeklyClaims: { union: ['c1'] } })], 403, uid);
  await c.expectStatus([c.patch(path, {}, { xp: { inc: 90 }, weeklyClaims: { union: ['zz'] } })], 403, uid);
  await c.expectStatus([c.patch(path, {}, { xp: { inc: 180 },
    weeklyClaims: { union: ['c1', 'r1'] } })], 403, uid);
  await c.expectStatus([c.patch(path, {}, { xp: { inc: 90 }, claimedChallenges: { union: ['c1'] } })], 403, uid);
  await c.expectStatus([c.patch(path, {}, { xp: { inc: 90 }, weeklyClaims: { union: ['c1'] } })], 200, uid);
  // Aynı hafta aynı ödül ikinci kez XP vermez (liste büyümez).
  await c.expectStatus([c.patch(path, {}, { xp: { inc: 90 }, weeklyClaims: { union: ['c1'] } })], 403, uid);
  await c.expectStatus([c.patch(path, {}, { xp: { inc: 180 }, claimedChallenges: { union: ['c4'] } })], 200, uid);
  assert.equal(await xp(path), 370);
});

test('haftalık talepler yalnızca pazartesi ilerleyen hafta başıyla sıfırlanır', async () => {
  const { uid, path } = await player({ challengeWeekStart: lastWeek, weeklyClaims: ['c1', 'r2'] });
  await c.expectStatus([c.update(path, { weeklyClaims: [] })], 403, uid);
  await c.expectStatus([c.update(path, { challengeWeekStart: key(new Date(monday.getTime() - DAY)),
    weeklyClaims: [] })], 403, uid);
  await c.expectStatus([c.update(path, { challengeWeekStart: key(new Date(monday.getTime() + 14 * DAY)),
    weeklyClaims: [] })], 403, uid);
  await c.expectStatus([c.update(path, { challengeWeekStart: twoWeeksAgo, weeklyClaims: [] })], 403, uid);
  // Sıfırlama ve aynı yazımda yeni haftanın ilk talebi.
  await c.expectStatus([c.patch(path, { challengeWeekStart: thisWeek, weeklyClaims: ['c1'] },
    { xp: { inc: 90 } })], 200, uid);
  assert.equal(await xp(path), 190);
});

test('takvim geri ya da ileri sarılamaz; seri günde bir adım artar', async () => {
  const { uid, path } = await player();
  await c.expectStatus([c.update(path, { lastActiveDate: twoWeeksAgo })], 403, uid);
  await c.expectStatus([c.update(path, { lastActiveDate: key(new Date(now.getTime() + 3 * DAY)) })], 403, uid);
  await c.expectStatus([c.update(path, { lastActiveDate: 'dün' })], 403, uid);
  await c.expectStatus([c.patch(path, {}, { streak: { inc: 5 } })], 403, uid);
  await c.expectStatus([c.patch(path, {}, { streak: { inc: 1 } })], 403, uid);
  await c.expectStatus([c.patch(path, { lastActiveDate: today }, { streak: { inc: 1 } })], 200, uid);
  await c.expectStatus([c.patch(path, {}, { streak: { inc: -2 } })], 200, uid);
});

test('görev ilerlemesi ve anahtarları yazılabilir; profil yazımı görev alanına dokunamaz', async () => {
  const { uid, path } = await player();
  await c.expectStatus([c.patch(path, {}, { 'challengeProgress.c1': { inc: 1 },
    'challengeKeys.c1': { union: ['story-1'] } })], 200, uid);
  await c.expectStatus([c.update(path, { displayName: 'Yeni ad', claimedChallenges: ['w3'] })], 200, uid);
  await c.expectStatus([c.update(path, { displayName: 'Başka', streak: 9 })], 403, uid);
  const other = `${c.runId}-other`;
  await c.expectStatus([c.patch(path, {}, { 'challengeProgress.c1': { inc: 1 } })], 403, other);
});

test('yeni profil XP veya ödülle doğamaz', async () => {
  const uid = `${c.runId}-new`;
  c.track(`users/${uid}`);
  await c.expectStatus([c.create(`users/${uid}`, { displayName: 'Yeni', xp: 500 })], 403, uid);
  await c.expectStatus([c.create(`users/${uid}`, { displayName: 'Yeni', claimedChallenges: ['w3'] })], 403, uid);
  await c.expectStatus([c.create(`users/${uid}`, { displayName: 'Yeni' })], 200, uid);
});
