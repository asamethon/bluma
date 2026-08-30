// Cihaz banı için komut satırı aracı (VPS'te doğrudan çalıştırılır — admin
// custom claim'i gerektirmez, servis hesabıyla konuşur).
//
//   node ban-device.js --list                     aktif banlar
//   node ban-device.js --devices                  hesap → cihaz eşlemesi
//   node ban-device.js --uid <uid> --reason "..."  kullanıcının cihazını banla
//   node ban-device.js --device <deviceId>        cihazı doğrudan banla
//   node ban-device.js --unban --device <deviceId>
//
// GOOGLE_APPLICATION_CREDENTIALS ayarlı olmalı.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { banDevice, unbanDevice } from './banDevice.js';

const app = initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);
const auth = getAuth(app);

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}
const has = (name) => process.argv.includes(`--${name}`);

async function listBans() {
  const snap = await db.collection('bannedDevices').get();
  if (snap.empty) return console.log('Banlı cihaz yok.');
  for (const d of snap.docs) {
    const v = d.data();
    console.log(`${d.id}\n  sebep: ${v.reason || '—'}\n  tarih: ${v.bannedAt?.toDate?.().toISOString() || '—'}`);
  }
}

// Tacizciyi bulmak için: hangi hesap hangi cihazda? Silinmiş hesabın kaydı
// olmaz — ban ancak hesap dururken (veya silinmeden önce) verilebilir.
async function listDevices() {
  const snap = await db.collection('userDevices').get();
  if (snap.empty) return console.log('Cihaz kaydı yok.');
  for (const d of snap.docs) {
    const v = d.data();
    const user = await db.collection('users').doc(d.id).get();
    const name = user.exists ? (user.data().username || user.data().displayName) : '(silinmiş)';
    console.log(`${d.id}  ${name}\n  cihaz: ${v.deviceId}  (${v.platform} ${v.model || ''})`);
  }
}

async function main() {
  if (has('list')) return listBans();
  if (has('devices')) return listDevices();

  const deviceId = arg('device');
  if (has('unban')) {
    if (!deviceId) throw new Error('--unban için --device <deviceId> gerekli');
    const r = await unbanDevice(auth, db, deviceId);
    return console.log(`Ban kaldırıldı. Yeniden etkinleştirilen hesap: ${r.enabledAccounts.length}`);
  }

  const uid = arg('uid');
  if (!uid && !deviceId) {
    console.log('Kullanım: --list | --devices | --uid <uid> | --device <id> | --unban --device <id>');
    return;
  }
  const r = await banDevice(auth, db, { uid, deviceId, reason: arg('reason') });
  console.log(`Banlandı: ${r.deviceId}\nDevre dışı bırakılan hesap: ${r.disabledAccounts.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Hata:', error.message);
    process.exit(1);
  });
