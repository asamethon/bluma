// Süresi dolmuş, e-postası hâlâ doğrulanmamış hesapları askıya alır.
//
// Sayaç kullanıcı uyarıyı GÖRDÜĞÜNDE başlar (emailGrace/{uid}.startedAt,
// istemcide yazılır ve değiştirilemez). Uyarıyı hiç görmemiş kullanıcının
// kaydı olmadığı için ona dokunulmaz — uygulamayı hiç açmayan biri
// habersiz askıya alınmaz.
//
//   node deactivate-unverified.js --dry-run
//   node deactivate-unverified.js
//   node deactivate-unverified.js --restore <uid>    askıyı kaldır
//
// Askıya alma GERİ ALINABİLİR: hesap silinmez, yalnızca disabled=true olur.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const app = initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);
const auth = getAuth(app);

const DRY_RUN = process.argv.includes('--dry-run');
const argValue = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
};
const GRACE_DAYS = Number(argValue('grace-days') || 7);

async function restore(uid) {
  await auth.updateUser(uid, { disabled: false });
  console.log(`Askı kaldırıldı: ${uid}`);
}

async function main() {
  const restoreUid = argValue('restore');
  if (restoreUid) return restore(restoreUid);

  const cutoff = new Date(Date.now() - GRACE_DAYS * 86400_000);
  const snap = await db.collection('emailGrace').get();
  console.log(
    `${snap.size} kayıtta süre başlatılmış; ${GRACE_DAYS} günden eski olanlara bakılıyor.` +
    (DRY_RUN ? ' DRY RUN — hiçbir hesap askıya alınmayacak.' : '')
  );

  let disabled = 0;
  for (const doc of snap.docs) {
    const startedAt = doc.data().startedAt?.toDate?.();
    if (!startedAt || startedAt > cutoff) continue;

    let user;
    try {
      user = await auth.getUser(doc.id);
    } catch {
      continue; // hesap zaten silinmiş
    }
    // Bu arada doğrulamış, sosyal girişe geçmiş ya da zaten askıdaysa geç.
    const isPassword = user.providerData.some((p) => p.providerId === 'password');
    if (!isPassword || user.emailVerified || user.disabled) continue;

    const days = Math.floor((Date.now() - startedAt.getTime()) / 86400_000);
    console.log(`[askıya al] ${user.email} (${days} gün önce uyarıldı)`);
    if (!DRY_RUN) await auth.updateUser(doc.id, { disabled: true });
    disabled += 1;
  }

  console.log(`\nBitti. Askıya alınan: ${disabled}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Askıya alma başarısız:', error);
    process.exit(1);
  });
