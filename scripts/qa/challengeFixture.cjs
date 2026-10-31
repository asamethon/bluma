// Yalnız yerel görev kabul testi: prepare / check <yorum-sayısı> / show / restore.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8787';
const app = initializeApp({ projectId: 'demo-bluma-local' });
const db = getFirestore(app);
const keys = ['xp', 'streak', 'lastActiveDate', 'challengeWeekStart', 'challengeProgress', 'claimedChallenges'];
const backup = path.join(__dirname, '../../.argent/results/challenge-fixture-backup.json');
const dayKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const today = new Date();
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
const refs = ['local-reader', 'local-writer'].map(id => db.doc(`users/${id}`));
async function main() {
  const data = await Promise.all(refs.map(async ref => (await ref.get()).data()));
  const command = process.argv[2];
  if (command === 'prepare') {
    if (fs.existsSync(backup)) throw Error('Önce mevcut fixture restore edilmeli.');
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, JSON.stringify(data.map(item => Object.fromEntries(keys.filter(key => key in item).map(key => [key, item[key]])))));
    await refs[0].update({ xp: 150, streak: 3, lastActiveDate: dayKey(yesterday), challengeWeekStart: dayKey(monday),
      challengeProgress: { r1: 2, r2: 2, r3: 2, c1: 1, c2: 1, w3: 1 }, claimedChallenges: ['w3'] });
    await refs[1].update({ xp: 40, streak: 1, lastActiveDate: dayKey(today), challengeWeekStart: dayKey(monday),
      challengeProgress: { c1: 0, c2: 2 }, claimedChallenges: ['c3'] });
    console.log('OK: A=150 XP, yorum 1, okuma 2, seri dün 3; B=40 XP.');
  } else if (command === 'restore') {
    const originals = JSON.parse(fs.readFileSync(backup));
    await Promise.all(refs.map((ref, index) => ref.update(Object.fromEntries(keys.map(key => [key, originals[index][key] ?? FieldValue.delete()])))));
    fs.renameSync(backup, backup + '.restored-' + Date.now());
    console.log('OK: görev fixture alanları geri yüklendi.');
  } else {
    if (command === 'check') {
      assert.equal(data[0].challengeProgress.c1, Number(process.argv[3]));
      assert.equal(data[0].challengeProgress.r1, 2);
      assert.equal(data[0].challengeProgress.c2, 1);
      assert.equal(data[0].xp, 150);
      assert.deepEqual(data[0].claimedChallenges, ['w3']);
      assert.equal(data[0].streak, 4);
      assert.equal(data[0].lastActiveDate, dayKey(today));
      assert.equal(data[1].xp, 40);
      assert.deepEqual(data[1].claimedChallenges, ['c3']);
    }
    console.log(JSON.stringify({ verdict: 'OK', users: data.map(item => Object.fromEntries(keys.map(key => [key, item[key]]))) }));
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => deleteApp(app));
