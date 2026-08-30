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
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
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
