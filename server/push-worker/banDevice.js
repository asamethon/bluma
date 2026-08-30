// Cihaz banı — hesabı silinen tacizci yeni hesapla geri dönemesin.
//
// Ban CİHAZA yazılır (bannedDevices/{deviceId}), hesaba değil: hesap silinse
// de ban durur. İki katmanlı çalışır:
//   1) O cihaza bağlı Firebase Auth hesapları devre dışı bırakılır — token
//      anında geçersizleşir, hiçbir istemci yaması bunu aşamaz.
//   2) bannedDevices kaydı, güvenlik kurallarındaki onBannedDevice() ile yeni
//      içerik yazımını ve cihazın yeni hesap kaydını reddeder.
//
// Cihaz kimliği istemcide features/moderation/services/deviceId.ts'te üretilir.
import { FieldValue } from 'firebase-admin/firestore';

async function deviceIdOfUser(db, uid) {
  const snap = await db.collection('userDevices').doc(uid).get();
  return snap.exists ? snap.data().deviceId : null;
}

async function accountsOnDevice(db, deviceId) {
  const snap = await db.collection('userDevices').where('deviceId', '==', deviceId).get();
  return snap.docs.map((d) => d.id);
}

/** `uid` veya `deviceId` ile banlar. Etkilenen hesapları döner. */
export async function banDevice(auth, db, { uid, deviceId, reason, byUid }) {
  const target = deviceId || (uid ? await deviceIdOfUser(db, uid) : null);
  if (!target) {
    throw new Error(uid ? `Kullanıcının cihaz kaydı yok: ${uid}` : 'deviceId veya uid gerekli');
  }

  await db.collection('bannedDevices').doc(target).set({
    deviceId: target,
    reason: reason || null,
    bannedBy: byUid || 'cli',
    bannedAt: FieldValue.serverTimestamp(),
  });

  const uids = await accountsOnDevice(db, target);
  for (const accountId of uids) {
    await auth.updateUser(accountId, { disabled: true }).catch((e) =>
      console.error(`[ban-device] hesap devre dışı bırakılamadı ${accountId}:`, e.message)
    );
  }

  console.log(`[ban-device] banlandı: ${target} (${uids.length} hesap)`);
  return { deviceId: target, disabledAccounts: uids };
}

export async function unbanDevice(auth, db, deviceId) {
  await db.collection('bannedDevices').doc(deviceId).delete();
  const uids = await accountsOnDevice(db, deviceId);
  for (const accountId of uids) {
    await auth.updateUser(accountId, { disabled: false }).catch(() => {});
  }
  console.log(`[ban-device] ban kaldırıldı: ${deviceId} (${uids.length} hesap)`);
  return { deviceId, enabledAccounts: uids };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error('Gövde çok büyük'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/** POST /admin/ban-device — Bearer idToken + `admin` custom claim şart. */
export async function handleBanDevice(auth, db, req, res, { unban = false } = {}) {
  const send = (code, payload) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };
  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return send(401, { error: 'Authorization: Bearer <idToken> gerekli' });

    const decoded = await auth.verifyIdToken(idToken);
    if (decoded.admin !== true) return send(403, { error: 'admin yetkisi gerekli' });

    const body = await readJson(req);
    const result = unban
      ? await unbanDevice(auth, db, body.deviceId)
      : await banDevice(auth, db, { ...body, byUid: decoded.uid });

    send(200, { success: true, ...result });
  } catch (error) {
    console.error('[ban-device] hata:', error.message);
    send(500, { success: false, error: error.message });
  }
}
