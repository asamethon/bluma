// Toplu duyuru — sürüm çıktığında tüm kullanıcılara haber vermek için.
//
// Her güncellemede değil, YALNIZCA istendiğinde elle çalıştırılır.
//
//   node announce.js --tag v2.1 --title "..." --message "..." --dry-run
//   node announce.js --tag v2.1 --title "..." --message "..." --url <store>
//
// Push'u kendisi gönderir (100'lük gruplar hâlinde) ve uygulama içi bildirim
// kaydını `pushSent: true` ile yazar; worker'ın limit(50) dinleyicisi toplu
// yazımda kaçırdığı için ondan geçmiyoruz.
//
// `--tag` aynı duyurunun iki kez gitmesini önler: etiketi alan kullanıcı
// atlanır, yani script'i güvenle tekrar çalıştırabilirsin.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { sendExpoPushBatch } from './expoPush.js';

const app = initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);

const DRY_RUN = process.argv.includes('--dry-run');
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
};

const TAG = arg('tag');
const TITLE = arg('title');
const MESSAGE = arg('message');
const URL = arg('url');       // mağaza bağlantısı — harici açılır
const ROUTE = arg('route') || (!URL ? '/notifications' : null); // varsayılan: duyuru listesi

/** Bu duyuruyu zaten alan kullanıcılar (etikete göre). */
async function alreadyNotified() {
  const snap = await db.collection('notifications')
    .where('type', '==', 'announcement')
    .where('data.tag', '==', TAG)
    .get();
  return new Set(snap.docs.map((d) => d.data().userId));
}

/** Push token'ı olan ve push'u kapatmamış kullanıcılar. */
async function recipients(skip) {
  const tokens = await db.collection('userPushTokens').get();
  const out = [];
  for (const doc of tokens.docs) {
    if (skip.has(doc.id)) continue;
    const token = doc.data().expoPushToken;
    if (!token) continue;

    const settings = await db.collection('notificationSettings').doc(doc.id).get();
    if (settings.exists && settings.data().pushNotifications === false) continue;

    out.push({ userId: doc.id, token });
  }
  return out;
}

async function main() {
  if (!TAG || !TITLE || !MESSAGE) {
    console.log('Kullanım: --tag <etiket> --title "..." --message "..." [--url <adres>] [--route </ekran>] [--dry-run]');
    return;
  }

  const skip = await alreadyNotified();
  const targets = await recipients(skip);
  console.log(
    `${targets.length} alıcı (${skip.size} kişi "${TAG}" duyurusunu zaten aldı).` +
    (DRY_RUN ? ' DRY RUN — hiçbir şey gönderilmeyecek.' : '')
  );
  console.log(`Başlık : ${TITLE}\nMesaj  : ${MESSAGE}`);
  if (URL) console.log(`Bağlantı: ${URL}`);
  if (DRY_RUN || targets.length === 0) return;

  const data = { type: 'announcement', tag: TAG, ...(URL ? { url: URL } : {}), ...(ROUTE ? { route: ROUTE } : {}) };

  const results = await sendExpoPushBatch(
    targets.map((t) => ({ to: t.token, title: TITLE, body: MESSAGE, data }))
  );
  const delivered = results.filter((r) => r?.status === 'ok').length;

  // Uygulama içi kayıt: push kaçsa bile bildirim listesinde görünür.
  for (let i = 0; i < targets.length; i += 400) {
    const batch = db.batch();
    for (const t of targets.slice(i, i + 400)) {
      batch.set(db.collection('notifications').doc(), {
        userId: t.userId,
        senderId: t.userId,
        type: 'announcement',
        title: TITLE,
        message: MESSAGE,
        data,
        isRead: false,
        pushSent: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  console.log(`\nBitti. Push ulaşan: ${delivered}/${targets.length}. Uygulama içi kayıt: ${targets.length}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Duyuru başarısız:', error);
    process.exit(1);
  });
