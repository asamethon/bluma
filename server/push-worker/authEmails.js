// Doğrulama / adres değişikliği / şifre sıfırlama postalarını KENDİMİZ
// göndeririz: Admin SDK yalnızca bağlantıyı üretir (kullanıcıya posta atmaz),
// tasarım ve gönderim bizde olur. Böylece Firebase'in kilitli şablonu ve
// paylaşımlı gönderen adresi devreden çıkar.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mailerReady, sendTemplateMail } from './mailer.js';

const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'templates');

const SUBJECTS = {
  verify: 'Bluma hesabını doğrula',
  change: 'Bluma e-posta adresini onayla',
  reset: 'Bluma şifreni sıfırla',
};

/**
 * Firebase'in barındırdığı işlem sayfası (bluma-dc10e.firebaseapp.com/__/auth/action)
 * varsayılan olarak İngilizce açılır; dil parametresi eklenmezse kullanıcı
 * Türkçe postadan İngilizce bir sayfaya düşüyor.
 */
function localized(link, lang = 'tr') {
  return link.includes('lang=') ? link : `${link}&lang=${lang}`;
}

/**
 * Bağlantıyı kendi işlem sayfamıza çevirir.
 *
 * Console'daki "Customize action URL" ayarı bu projede kilitli (şablon
 * kilidiyle aynı kısıt). Ama bağlantıyı BİZ ürettiğimiz için postaya koymadan
 * önce adresini değiştirebiliyoruz: sorgu dizesi (mode, oobCode, apiKey)
 * olduğu gibi taşınıyor ve sayfamız Identity Toolkit'e doğrudan kendisi
 * gidiyor — Firebase'in bir şey yönlendirmesine gerek yok.
 *
 * ACTION_PAGE_URL tanımsızsa Firebase'in kendi sayfası kullanılır.
 */
function toOwnActionPage(link) {
  const target = process.env.ACTION_PAGE_URL;
  if (!target) return link;
  try {
    const own = new URL(target);
    own.search = new URL(link).search;
    return own.toString();
  } catch (error) {
    console.error('[auth-email] işlem sayfası adresi geçersiz:', error.message);
    return link;
  }
}

const actionLink = (link) => toOwnActionPage(actionLink(link));

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

/**
 * POST /send-auth-email — Bearer idToken şart; posta YALNIZCA çağıranın kendi
 * hesabına gider. Böylece uç nokta başkasına posta göndertmek için
 * kullanılamaz.
 *
 * Gövde: { kind: 'verify' | 'change' | 'reset', newEmail? }
 */
export async function handleSendAuthEmail(auth, req, res) {
  const send = (code, payload) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };
  try {
    if (!mailerReady()) {
      // İstemci bunu görünce Firebase'in kendi gönderimine düşer.
      return send(503, { success: false, error: 'mailer-unconfigured' });
    }

    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return send(401, { success: false, error: 'Bearer <idToken> gerekli' });

    const decoded = await auth.verifyIdToken(idToken);
    const user = await auth.getUser(decoded.uid);
    if (!user.email) return send(400, { success: false, error: 'Hesapta e-posta yok' });

    const { kind = 'verify', newEmail } = await readJson(req);

    if (kind === 'change') {
      if (!newEmail) return send(400, { success: false, error: 'newEmail gerekli' });
      // Bağlantı YENİ adrese gider; adres ancak tıklanınca değişir.
      const link = await auth.generateVerifyAndChangeEmailLink(user.email, newEmail);
      await sendTemplateMail({
        template: 'email-change',
        to: newEmail,
        subject: SUBJECTS.change,
        values: { LINK: actionLink(link), DISPLAY_NAME: user.displayName || '', NEW_EMAIL: newEmail },
      });
    } else if (kind === 'reset') {
      const link = await auth.generatePasswordResetLink(user.email);
      await sendTemplateMail({
        template: 'password-reset',
        to: user.email,
        subject: SUBJECTS.reset,
        values: { LINK: actionLink(link), DISPLAY_NAME: user.displayName || '' },
      });
    } else {
      if (user.emailVerified) return send(200, { success: true, alreadyVerified: true });
      const link = await auth.generateEmailVerificationLink(user.email);
      await sendTemplateMail({
        template: 'verify-email',
        to: user.email,
        subject: SUBJECTS.verify,
        values: { LINK: actionLink(link), DISPLAY_NAME: user.displayName || '' },
      });
    }

    send(200, { success: true });
  } catch (error) {
    console.error('[send-auth-email] hata:', error.message);
    send(500, { success: false, error: error.message });
  }
}

/**
 * Kendi işlem sayfamız (Console → Customize action URL buraya bakar).
 *
 * Firebase'in barındırdığı sayfa İngilizce, markasız ve fazladan bir onay
 * tıklaması istiyordu. Bu sayfa oobCode'u alıp işlemi kendisi tamamlıyor.
 * Sayfa statiktir; oobCode adres çubuğunda kalır ve dışarı sızmasın diye
 * referrer kapatılmıştır (bkz. templates/action.html).
 */
export async function handleActionPage(req, res) {
  try {
    const html = await readFile(join(TEMPLATE_DIR, 'action.html'), 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(html);
  } catch (error) {
    console.error('[auth/action] sayfa okunamadı:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Sayfa yüklenemedi');
  }
}
