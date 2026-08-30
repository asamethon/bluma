// Zamanlanmış bir iş başarısız olduğunda yöneticiye e-posta atar.
//
// bluma-cron.sh tarafından çağrılır; hata çıktısı stdin'den gelir.
// Alıcı: ADMIN_EMAIL, yoksa MAIL_REPLY_TO.
//
//   echo "hata metni" | node cron/alert.js "notify-unverified.js --grace-day 6"
import { hostname } from 'node:os';
import { sendPlainMail, mailerReady } from '../mailer.js';

const TO = process.env.ADMIN_EMAIL || process.env.MAIL_REPLY_TO;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    // stdin bağlı değilse bekleyip asılı kalma.
    if (process.stdin.isTTY) resolve('');
  });
}

async function main() {
  if (!TO) return console.error('[alert] ADMIN_EMAIL/MAIL_REPLY_TO tanımsız — uyarı gönderilemiyor.');
  if (!mailerReady()) return console.error('[alert] RESEND_API_KEY tanımsız — uyarı gönderilemiyor.');

  const job = process.argv[2] || 'bilinmeyen iş';
  const output = (await readStdin()).trim() || '(çıktı yok)';
  // Uzun çıktıyı kırp; posta okunabilir kalsın.
  const tail = output.length > 4000 ? output.slice(-4000) : output;

  await sendPlainMail({
    to: TO,
    subject: `Bluma cron hatası: ${job}`,
    // HOSTNAME bir kabuk değişkeni; dışa aktarılmadığı için Node göremiyordu.
    text: `Sunucu: ${hostname()}\nZaman: ${new Date().toISOString()}\nİş: ${job}\n\n--- çıktı ---\n${tail}`,
  });
}

main().catch((error) => {
  // Uyarı gönderilemezse en azından journald'a düşsün.
  console.error('[alert] uyarı gönderilemedi:', error.message);
  process.exit(0);
});
