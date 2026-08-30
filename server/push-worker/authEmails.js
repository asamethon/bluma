// Doğrulama / adres değişikliği / şifre sıfırlama postalarını KENDİMİZ
// göndeririz: Admin SDK yalnızca bağlantıyı üretir (kullanıcıya posta atmaz),
// tasarım ve gönderim bizde olur. Böylece Firebase'in kilitli şablonu ve
// paylaşımlı gönderen adresi devreden çıkar.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mailerReady, sendTemplateMail } from './mailer.js';

const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'templates');

// Yalnızca iki dil tutuluyor: Türkçe ve İngilizce. Türkçe olmayan her
// kullanıcı İngilizce alır — dokuz dile ayrı şablon bakımı yapmaktansa
// anlaşılır tek bir yedek dil daha sağlıklı.
const SUBJECTS = {
  tr: {
    verify: 'Bluma hesabını doğrula',
    change: 'Bluma e-posta adresini onayla',
    reset: 'Bluma şifreni sıfırla',
  },
  en: {
    verify: 'Verify your Bluma account',
    change: 'Confirm your new Bluma email address',
    reset: 'Reset your Bluma password',
  },
};

/** İstemcinin gönderdiği yerel ayardan şablon dili. */
const pickLang = (locale) => (String(locale || '').toLowerCase().startsWith('tr') ? 'tr' : 'en');

/**
 * Firebase'in barındırdığı işlem sayfası (bluma-dc10e.firebaseapp.com/__/auth/action)
 * varsayılan olarak İngilizce açılır; dil parametresi eklenmezse kullanıcı
 * Türkçe postadan İngilizce bir sayfaya düşüyor.
 */
function localized(link, lang) {
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

const actionLink = (link, lang) => toOwnActionPage(localized(link, lang));

/**
 * Postayı üretip gönderir. Hem HTTP uç noktası hem de send-auth-mail.js
 * bunu kullanır — test komutunun gerçek yolu sınaması için tek kaynak şart.
 */
export async function sendAuthMailFor(auth, user, { kind = 'verify', lang = 'tr', newEmail } = {}) {
  if (kind === 'change') {
    if (!newEmail) throw new Error('newEmail gerekli');
    // Bağlantı YENİ adrese gider; adres ancak tıklanınca değişir.
    const link = await auth.generateVerifyAndChangeEmailLink(user.email, newEmail);
    return sendTemplateMail({
      template: 'email-change',
      lang,
      to: newEmail,
      subject: SUBJECTS[lang].change,
      values: { LINK: actionLink(link, lang), DISPLAY_NAME: user.displayName || '', NEW_EMAIL: newEmail },
    });
  }

  if (kind === 'reset') {
    const link = await auth.generatePasswordResetLink(user.email);
    return sendTemplateMail({
      template: 'password-reset',
      lang,
      to: user.email,
      subject: SUBJECTS[lang].reset,
      values: { LINK: actionLink(link, lang), DISPLAY_NAME: user.displayName || '' },
    });
  }

  const link = await auth.generateEmailVerificationLink(user.email);
  return sendTemplateMail({
    template: 'verify-email',
    lang,
    to: user.email,
    subject: SUBJECTS[lang].verify,
    values: { LINK: actionLink(link, lang), DISPLAY_NAME: user.displayName || '' },
  });
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

    const { kind = 'verify', newEmail, locale } = await readJson(req);
    const lang = pickLang(locale);

    if (kind === 'verify' && user.emailVerified) {
      return send(200, { success: true, alreadyVerified: true });
    }
    await sendAuthMailFor(auth, user, { kind, lang, newEmail });

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

/**
 * Basit oran sınırı (bellek içi).
 *
 * /send-password-reset kimlik doğrulaması İSTEMEZ — kullanıcı zaten giriş
 * yapamıyor. Bu yüzden kötüye kullanıma açık: aynı adrese sınırsız posta
 * yağdırılabilir. Adres başına ve toplamda sınırlıyoruz.
 *
 * Bellek içi olması yeniden başlatmada sıfırlanır; kabul edilebilir, çünkü
 * amaç kaba bir tavan koymak, kusursuz muhasebe değil.
 */
const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_PER_EMAIL = 3;
const RESET_TOTAL = 50;
const resetHits = new Map();

function rateLimited(email) {
  const now = Date.now();
  for (const [key, times] of resetHits) {
    const fresh = times.filter((t) => now - t < RESET_WINDOW_MS);
    if (fresh.length) resetHits.set(key, fresh);
    else resetHits.delete(key);
  }
  const total = [...resetHits.values()].reduce((n, times) => n + times.length, 0);
  if (total >= RESET_TOTAL) return true;

  const mine = resetHits.get(email) || [];
  if (mine.length >= RESET_PER_EMAIL) return true;
  resetHits.set(email, [...mine, now]);
  return false;
}

/**
 * POST /send-password-reset — { email, locale }
 *
 * Kimlik doğrulaması yok (kullanıcı giriş yapamıyor). Hesap olsun olmasın
 * HER ZAMAN başarı döner: aksi halde uç nokta "bu adres kayıtlı mı?"
 * sorusuna cevap veren bir hesap sayacına dönüşür.
 */
export async function handleSendPasswordReset(auth, req, res) {
  const ok = () => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  };
  try {
    if (!mailerReady()) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'mailer-unconfigured' }));
      return;
    }

    const { email, locale } = await readJson(req);
    const address = String(email || '').trim().toLowerCase();
    if (!address || !address.includes('@')) return ok();

    if (rateLimited(address)) {
      console.log('[send-password-reset] oran sınırı:', address);
      return ok();
    }

    // Hesap yoksa ya da sosyal girişse sessizce başarı dön — bilgi sızdırma.
    let user;
    try {
      user = await auth.getUserByEmail(address);
    } catch {
      return ok();
    }
    if (!user.providerData.some((p) => p.providerId === 'password')) return ok();

    await sendAuthMailFor(auth, user, { kind: 'reset', lang: pickLang(locale) });
    ok();
  } catch (error) {
    console.error('[send-password-reset] hata:', error.message);
    // İstemci yedeğe düşebilsin diye hatayı gizlemiyoruz.
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}
