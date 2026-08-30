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
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { handleDeleteAccount } from './deleteAccount.js';
import { handleBanDevice } from './banDevice.js';

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
  follow_request: 'followNotifications',
  follow_accepted: 'followNotifications',
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

// Firestore Timestamp | Date | null → ms.
function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts._seconds === 'number') return ts._seconds * 1000;
  return 0;
}

// Expo push token'ı FİZİKSEL cihaza aittir, kullanıcıya değil. Aynı cihazda iki
// hesap kullanılınca (çıkış yapıp başka hesaba girmek dâhil) her iki kullanıcının
// userPushTokens dokümanı AYNI token'ı taşır. Worker alıcıyı userId ile bulup bu
// token'a push atınca bildirim o an cihazda oturumlu olan (yanlış) hesaba düşer —
// "eski hesabımı takip ettiğimde bildirim bana geliyor" bug'ının kökü buydu.
//
// Değişmez kural: bir token yalnızca EN SON kaydeden kullanıcıya aittir. Bir
// token dokümanı yazıldığında/güncellendiğinde, aynı token'ı taşıyan daha ESKİ
// (updatedAt'i küçük) tüm dokümanları sileriz. İstemci de çıkışta kendi
// dokümanını siler; bu, temiz çıkış yapılmayan hesap-değiştirmelerine karşı
// sunucu tarafı güvencesidir. Karşılaştırma updatedAt ile yapıldığından açılıştaki
// ilk snapshot'ta dokümanlar rastgele sırada işlense de en yeni olan korunur.
async function dedupePushToken(docSnap) {
  const token = docSnap.data()?.expoPushToken;
  if (!token) return;
  const mineMs = toMillis(docSnap.data()?.updatedAt);
  const snap = await db.collection('userPushTokens').where('expoPushToken', '==', token).get();
  const stale = snap.docs.filter(
    (d) => d.id !== docSnap.id && toMillis(d.data()?.updatedAt) < mineMs
  );
  if (!stale.length) return;
  await Promise.all(stale.map((d) => d.ref.delete().catch(() => {})));
  console.log(`[pushTokens] ${docSnap.id} token'ı için ${stale.length} eski kayıt silindi`);
}

// userPushTokens dinleyicisi — watchAdded'dan farklı olarak ilk snapshot'ı
// ATLAMAZ: açılışta zaten var olan çift kayıtları da temizlemek istiyoruz.
// 'removed' değişiklikleri (silme sonucu) yok sayılır, döngü oluşmaz.
function watchPushTokens() {
  const attach = () => {
    let unsub = null;
    unsub = db.collection('userPushTokens').onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            dedupePushToken(change.doc).catch((e) => console.error('[pushTokens] hata:', e));
          }
        });
      },
      (error) => {
        console.error('[pushTokens] dinleyici hatası, 10sn sonra yeniden bağlanılacak:', error?.message || error);
        try { unsub && unsub(); } catch {}
        setTimeout(attach, 10000);
      }
    );
  };
  attach();
}

// Alıcı (ownerId) gönderen'i (senderId) engellediyse push atlanır. Kurallar
// artık engellenen yazımını kaynağında reddediyor; bu, savunma derinliği ve
// kural deploy'undan ÖNCE yazılmış dokümanlar için ek koruma.
async function isBlocked(ownerId, senderId) {
  if (!ownerId || !senderId || ownerId === senderId) return false;
  try {
    const snap = await db.collection('users').doc(ownerId).collection('blocked').doc(senderId).get();
    return snap.exists;
  } catch {
    return false;
  }
}

// Başarılı gönderimde true döner — DM'lerde "çift tik" filigranı buna bağlı.
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
      return false;
    }
    console.log(`[push] gönderildi: "${title}"`);
    return true;
  } catch (error) {
    console.error('[push] Expo push isteği hata verdi:', error.message);
    return false;
  }
}

async function processNotification(docSnap) {
  const n = docSnap.data();
  if (!n?.userId) return;
  if (await isBlocked(n.userId, n.senderId)) {
    console.log(`[notifications] atlandı (engellenmiş): ${n.senderId} -> ${n.userId}`);
    return;
  }

  const settings = await getSettings(n.userId);
  if (!settings.pushNotifications) {
    console.log(`[notifications] atlandı (push kapalı): ${n.userId}`);
    return;
  }
  const categoryField = CATEGORY_FIELD[n.type];
  if (categoryField && settings[categoryField] === false) {
    console.log(`[notifications] atlandı (${categoryField} kapalı): ${n.userId}`);
    return;
  }

  const token = await getPushToken(n.userId);
  if (!token) {
    console.log(`[notifications] atlandı (token yok): ${n.userId}`);
    return;
  }

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
  if (await isBlocked(recipientId, msg.senderId)) {
    console.log(`[messages] atlandı (engellenmiş): ${msg.senderId} -> ${recipientId}`);
    return;
  }

  const settings = await getSettings(recipientId);
  if (!settings.pushNotifications) {
    console.log(`[messages] atlandı (push kapalı): ${recipientId}`);
    return;
  }

  const token = await getPushToken(recipientId);
  if (!token) {
    console.log(`[messages] atlandı (token yok): ${recipientId}`);
    return;
  }

  const senderSnap = await db.collection('users').doc(msg.senderId).get();
  const senderName = senderSnap.data()?.displayName || senderSnap.data()?.username || 'Yeni mesaj';
  const body = msg.text || (msg.image ? '📷 Fotoğraf gönderdi' : 'Yeni mesaj gönderdi');

  const ok = await sendExpoPush(token, senderName, body, { type: 'message', senderId: msg.senderId });
  // Bildirim alıcının cihazına ulaştıysa "teslim edildi" filigranını ilerlet —
  // gönderen istemci bunu görünce soluk çift tike geçer. Filigran serverTimestamp
  // olduğundan daima artar; istemci kuralları buraya yazamaz (Admin SDK).
  if (ok) {
    await threadRef
      .set({ lastDelivered: { [recipientId]: FieldValue.serverTimestamp() } }, { merge: true })
      .catch((e) => console.error('[messages] teslim filigranı yazılamadı:', e.message));
  }
}

// Her iki dinleyici de "skip initial snapshot" deseni kullanır — onSnapshot
// ilk tetiklendiğinde eşleşen TÜM geçmiş dokümanları 'added' olarak verir;
// bunları işlersek işçi her başladığında geçmişin tamamına push atardı.
// Kendini iyileştiren dinleyici: hata gelince (ör. DM için collection-group
// index henüz deploy edilmemişse FAILED_PRECONDITION) log basıp 10sn sonra
// yeniden bağlanır. Böylece index sonradan hazır olunca worker'ı yeniden
// başlatmadan DM push'ları kendiliğinden çalışmaya başlar. Yeniden bağlanınca
// ilk snapshot yine atlanır (geçmişe toplu push atmamak için).
function watchAdded(query, handler, label) {
  let first = true;
  const attach = () => {
    let unsub = null;
    unsub = query.onSnapshot(
      (snapshot) => {
        if (first) { first = false; return; }
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            handler(change.doc).catch((error) => console.error(`[${label}] işleme hatası:`, error));
          }
        });
      },
      (error) => {
        console.error(`[${label}] dinleyici hatası, 10sn sonra yeniden bağlanılacak:`, error?.message || error);
        try { unsub && unsub(); } catch {}
        first = true;
        setTimeout(attach, 10000);
      }
    );
  };
  attach();
}

watchAdded(db.collection('notifications').orderBy('createdAt', 'desc').limit(50), processNotification, 'notifications');
watchAdded(db.collectionGroup('messages').orderBy('createdAt', 'desc').limit(50), processDirectMessage, 'messages');
watchPushTokens();

console.log('Bluma push worker başladı — notifications, messages ve push token dedupe dinleniyor.');

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
  // Cihaz banı — admin custom claim'i olan hesap çağırabilir (bkz. banDevice.js).
  if (req.url === '/admin/ban-device' && req.method === 'POST') {
    handleBanDevice(auth, db, req, res);
    return;
  }
  if (req.url === '/admin/unban-device' && req.method === 'POST') {
    handleBanDevice(auth, db, req, res, { unban: true });
    return;
  }
  res.writeHead(404);
  res.end();
}).listen(PORT, HOST, () => console.log(`Health check http://${HOST}:${PORT}/health`));
