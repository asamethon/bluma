// Kendi e-posta gönderimimiz.
//
// Firebase Auth'un şablon düzenlemesi bu projede kilitli ve gönderen adresi
// bluma-dc10e.firebaseapp.com (paylaşımlı, itibarı bize ait değil, Gmail
// spam'e atıyor). Çözüm postayı Firebase'e hiç göndertmemek: bağlantıyı
// Admin SDK üretir, tasarım ve gönderim bizde olur.
//
// Sağlayıcı: Resend (HTTP API — ek bağımlılık gerekmiyor, düz fetch).
// Başka sağlayıcıya geçilecekse yalnızca deliver() değişir.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'templates');
const API_KEY = process.env.RESEND_API_KEY;
// Örn: "Bluma <bluma@d4tecompany.com>" — alan adı sağlayıcıda doğrulanmış olmalı.
const FROM = process.env.MAIL_FROM || 'Bluma <onboarding@resend.dev>';
// Yanıtlanabilir gerçek bir adres; boşsa hiç gönderilmez.
const REPLY_TO = process.env.MAIL_REPLY_TO || '';

const cache = new Map();

async function template(name) {
  if (!cache.has(name)) {
    cache.set(name, await readFile(join(TEMPLATE_DIR, `${name}.html`), 'utf8'));
  }
  return cache.get(name);
}

/** %LINK% gibi yer tutucuları doldurur. */
function fill(html, values) {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`%${key}%`, value ?? ''),
    html
  );
}

/**
 * HTML'den düz metin karşılığı üretir.
 *
 * Yalnızca-HTML postalar spam puanı alır; ciddi göndericiler her zaman düz
 * metin alternatifini de yollar. Şablondan türettiğimiz için ayrı bir metin
 * şablonu bakımı gerekmiyor, ikisi hep senkron kalıyor.
 */
function htmlToText(html) {
  return html
    // Gizli önizleme satırı metin sürümünde tekrar olurdu.
    .replace(/<div[^>]*display:none[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|tr|div|h[1-6])>/gi, '\n\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const label = text.replace(/<[^>]+>/g, '').trim();
      // Bağlantı metni zaten adresin kendisiyse iki kez yazma.
      return label && label !== href ? `${label}: ${href}` : href;
    })
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    // Önce satırları kırp, SONRA boşlukları sıkıştır — tersi sırada
    // "boşluk içeren" satırlar boş sayılmadığı için sıkıştırma çalışmaz.
    .split('\n').map((line) => line.trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function deliver({ to, subject, html }) {
  if (!API_KEY) {
    throw new Error('RESEND_API_KEY tanımlı değil — kendi gönderimimiz kapalı');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      // Düz metin alternatifi + gerçek bir yanıt adresi: ikisi de teslim
      // edilebilirliği artırır ("noreply" bir adres bile değildi).
      text: htmlToText(html),
      ...(REPLY_TO ? { reply_to: [REPLY_TO] } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Gönderim başarısız (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/** Kendi gönderimimiz yapılandırılmış mı? İstemci buna göre yedeğe düşer. */
export const mailerReady = () => !!API_KEY;

export async function sendTemplateMail({ template: name, to, subject, values }) {
  const html = fill(await template(name), { EMAIL: to, ...values });
  await deliver({ to, subject, html });
  console.log(`[mail] gönderildi: ${name} -> ${to}`);
}
