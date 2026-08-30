// Doğrulama/şifre postasını sunucudan elle gönderir.
//
// Uygulamadan tetiklemek Firebase'in hız sınırına takılabiliyor; bu komut
// uç noktanın kullandığı AYNI fonksiyonu çağırır (sendAuthMailFor), yani
// testi gerçek yolu sınar.
//
//   node send-auth-mail.js --email a@b.com
//   node send-auth-mail.js --email a@b.com --lang en
//   node send-auth-mail.js --email a@b.com --kind reset
//   node send-auth-mail.js --email a@b.com --kind change --new-email c@d.com
//
// DİKKAT: gerçek posta gider. `change` tıklanırsa hesabın adresi değişir.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { sendAuthMailFor } from './authEmails.js';
import { mailerReady } from './mailer.js';

const app = initializeApp({ credential: applicationDefault() });
const auth = getAuth(app);

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
};

async function main() {
  const email = arg('email');
  if (!email) {
    console.log('Kullanım: --email <adres> [--kind verify|reset|change] [--lang tr|en] [--new-email <adres>]');
    return;
  }
  if (!mailerReady()) {
    throw new Error('RESEND_API_KEY tanımlı değil — ortam dosyası yüklenmemiş. systemd dışında çalıştırıyorsan: set -a; . /etc/bluma/push-worker.env; set +a');
  }

  const kind = arg('kind') || 'verify';
  const lang = arg('lang') === 'en' ? 'en' : 'tr';
  const user = await auth.getUserByEmail(email);

  if (kind === 'verify' && user.emailVerified) {
    console.log(`${email} zaten doğrulanmış — yine de gönderiliyor (test amaçlı).`);
  }

  await sendAuthMailFor(auth, user, { kind, lang, newEmail: arg('new-email') });
  console.log(`Gönderildi: ${lang}/${kind} -> ${kind === 'change' ? arg('new-email') : email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Gönderim başarısız:', error.message);
    process.exit(1);
  });
