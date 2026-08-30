// E-postasını doğrulamamış kullanıcılara hatırlatma bildirimi.
//
// Push'u kendisi göndermez: `notifications` koleksiyonuna doküman yazar,
// index.js'teki dinleyici onu görüp Expo push'unu atar. Böylece bildirim
// hem telefona düşer hem de uygulama içindeki bildirim listesinde kalır —
// kullanıcı push'u kaçırsa bile görür.
//
//   node notify-unverified.js --dry-run     kimlere gideceğini göster
//   node notify-unverified.js               gönder
//   node notify-unverified.js --min-age-hours 48 --cooldown-days 14
//
// GOOGLE_APPLICATION_CREDENTIALS ayarlı olmalı.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const app = initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);
const auth = getAuth(app);

const DRY_RUN = process.argv.includes('--dry-run');
const argValue = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};

// Yeni kaydolan kullanıcı doğrulama postasını zaten aldı; hemen dürtmek
// rahatsız edici olur.
const MIN_AGE_HOURS = argValue('min-age-hours', 24);
// Aynı kişiye tekrar tekrar hatırlatmamak için.
const COOLDOWN_DAYS = argValue('cooldown-days', 7);

/** Parola ile açılmış ve e-postası doğrulanmamış hesaplar. */
async function unverifiedUsers() {
  const out = [];
  const cutoff = Date.now() - MIN_AGE_HOURS * 3600 * 1000;
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      const isPassword = user.providerData.some((p) => p.providerId === 'password');
      if (!isPassword || user.emailVerified || user.disabled) continue;
      if (new Date(user.metadata.creationTime).getTime() > cutoff) continue;
      out.push(user);
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return out;
}

/** Cooldown içinde zaten hatırlatma gönderilmiş mi? */
async function recentlyNotified(uid) {
  const since = Timestamp.fromMillis(Date.now() - COOLDOWN_DAYS * 86400 * 1000);
  const snap = await db.collection('notifications')
    .where('userId', '==', uid)
    .where('type', '==', 'verify_email')
    .where('createdAt', '>=', since)
    .limit(1)
    .get();
  return !snap.empty;
}

async function notify(user) {
  await db.collection('notifications').add({
    userId: user.uid,
    // Sistem bildirimi; gönderen alıcının kendisi (welcome ile aynı desen).
    senderId: user.uid,
    type: 'verify_email',
    title: 'E-postanı doğrula',
    message: 'Hesabını kullanmaya devam etmek için e-posta adresini doğrulaman gerekiyor.',
    data: {
      // Metin okuyanın dilinde üretilsin diye tarif dokümana yazılır.
      i18n: {
        titleKey: 'notifications.verifyEmailTitle',
        messageKey: 'notifications.verifyEmailMessage',
        params: {},
      },
      // Bildirime tıklanınca açılacak ekran (app/_layout.tsx dinleyicisi).
      route: '/profile/verify-email',
    },
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function main() {
  const users = await unverifiedUsers();
  console.log(
    `${users.length} doğrulanmamış hesap (kayıt üstünden ${MIN_AGE_HOURS} saat geçmiş).` +
    (DRY_RUN ? ' DRY RUN — hiçbir şey yazılmayacak.' : '')
  );

  let sent = 0;
  let skipped = 0;
  for (const user of users) {
    if (await recentlyNotified(user.uid)) {
      console.log(`[atlandı] ${user.email} (son ${COOLDOWN_DAYS} günde hatırlatıldı)`);
      skipped += 1;
      continue;
    }
    console.log(`[gönder] ${user.email}`);
    if (!DRY_RUN) await notify(user);
    sent += 1;
  }
  console.log(`\nBitti. Gönderilen: ${sent}, atlanan: ${skipped}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Hatırlatma gönderimi başarısız:', error);
    process.exit(1);
  });
