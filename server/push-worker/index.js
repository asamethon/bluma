// Bluma push bildirim işçisi (bkz. docs/YAPILACAKLAR.md 0.3 / 3.1).
//
// Önceden istemci (herhangi bir oturumlu kullanıcı) doğrudan başka birinin
// push token'ını okuyup Expo'ya gönderiyordu — bu, userPushTokens'ın
// herkese açık okunmasını gerektiriyordu (spam/phishing riski). Bu servis
// Admin SDK ile çalışır (güvenlik kurallarına tabi değildir), token'ı
// yalnızca burada okur; istemci artık kendi token'ını yazmak dışında
// userPushTokens'a hiç dokunmaz.
//
// İzlediği iki kaynak:
//   1) notifications          — beğeni/yorum/takip/bölüm vb. uygulama-içi bildirimler
//   2) messageThreads/*/messages (collectionGroup) — DM'ler (bilinçli olarak
//      notifications koleksiyonuna yazılmaz, bkz. messagingStore.ts yorumu)
//
// Çalıştırma: GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json node index.js

import http from 'node:http';
// firebase-admin v14+ eski admin.credential.X() / admin.firestore() /
// admin.auth() namespace API'sini kaldırdı — modüler alt-yol importları
// gerekiyor (bkz. https://firebase.google.com/docs/admin/migrate).
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { handleDeleteAccount } from './deleteAccount.js';

const PORT = Number(process.env.PORT || 8789);
const HOST = process.env.HOST || '127.0.0.1';

const app = initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);
const auth = getAuth(app);

const DEFAULT_SETTINGS = {
  followNotifications: true,
  likeNotifications: true,
  commentNotifications: true,
  mentionNotifications: true,
  storyNotifications: true,
  pushNotifications: true,
};

// Bildirim türü → notificationSettings'teki karşılık gelen alan. Karşılığı
// olmayan türler (mention, welcome) yalnızca genel pushNotifications'a bakar.
const CATEGORY_FIELD = {
  follow: 'followNotifications',
  like: 'likeNotifications',
  comment: 'commentNotifications',
  story_published: 'storyNotifications',
  new_chapter: 'storyNotifications',
  conversation_announcement: 'storyNotifications',
};

async function getSettings(userId) {
  try {
    const snap = await db.collection('notificationSettings').doc(userId).get();
    return snap.exists ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function getPushToken(userId) {
  try {
    const snap = await db.collection('userPushTokens').doc(userId).get();
    return snap.exists ? snap.data()?.expoPushToken || null : null;
  } catch {
    return null;
  }
}

async function sendExpoPush(token, title, body, data) {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, sound: 'default', title, body, data }),
    });
    const result = await res.json();
    if (result?.data?.status !== 'ok') {
      console.error('[push] Expo push başarısız:', JSON.stringify(result));
    }
  } catch (error) {
    console.error('[push] Expo push isteği hata verdi:', error.message);
  }
}

async function processNotification(docSnap) {
  const n = docSnap.data();
  if (!n?.userId) return;

  const settings = await getSettings(n.userId);
  if (!settings.pushNotifications) return;
  const categoryField = CATEGORY_FIELD[n.type];
  if (categoryField && settings[categoryField] === false) return;

  const token = await getPushToken(n.userId);
  if (!token) return;

  await sendExpoPush(token, n.title || 'Bluma', n.message || '', n.data || {});
}

async function processDirectMessage(docSnap) {
  const msg = docSnap.data();
  const threadRef = docSnap.ref.parent.parent;
  if (!threadRef || !msg?.senderId) return;

  const threadSnap = await threadRef.get();
  const participants = threadSnap.data()?.participants || [];
  const recipientId = participants.find((p) => p !== msg.senderId);
  if (!recipientId) return;

  const settings = await getSettings(recipientId);
  if (!settings.pushNotifications) return;

  const token = await getPushToken(recipientId);
  if (!token) return;

  const senderSnap = await db.collection('users').doc(msg.senderId).get();
  const senderName = senderSnap.data()?.displayName || senderSnap.data()?.username || 'Yeni mesaj';
  const body = msg.text || (msg.image ? '📷 Fotoğraf gönderdi' : 'Yeni mesaj gönderdi');

  await sendExpoPush(token, senderName, body, { type: 'message', senderId: msg.senderId });
}

// Her iki dinleyici de "skip initial snapshot" deseni kullanır — onSnapshot
// ilk tetiklendiğinde eşleşen TÜM geçmiş dokümanları 'added' olarak verir;
// bunları işlersek işçi her başladığında geçmişin tamamına push atardı.
function watchAdded(query, handler, label) {
  let first = true;
  query.onSnapshot(
    (snapshot) => {
      if (first) { first = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          handler(change.doc).catch((error) => console.error(`[${label}] işleme hatası:`, error));
        }
      });
    },
    (error) => console.error(`[${label}] dinleyici hatası:`, error)
  );
}

watchAdded(db.collection('notifications').orderBy('createdAt', 'desc').limit(50), processNotification, 'notifications');
watchAdded(db.collectionGroup('messages').orderBy('createdAt', 'desc').limit(50), processDirectMessage, 'messages');

console.log('Bluma push worker başladı — notifications ve messages dinleniyor.');

// Health endpoint + hesap silme (bkz. YAPILACAKLAR 0.4/3.1 — kalıcı çözüm,
// Admin SDK re-authenticate gerektirmez ve DM thread'lerini de silebilir).
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (req.url === '/delete-account' && req.method === 'POST') {
    handleDeleteAccount(auth, db, req, res);
    return;
  }
  res.writeHead(404);
  res.end();
}).listen(PORT, HOST, () => console.log(`Health check http://${HOST}:${PORT}/health`));
