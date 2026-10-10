import { pickLang, sendAuthMailFor } from './authEmailCore.js';
import { readJson, sendJson } from './httpJson.js';
import { mailerReady } from './mailer.js';

const WINDOW_MS = 60 * 60 * 1000;
const PER_EMAIL = 3;
const TOTAL = 50;
const hits = new Map();

function rateLimited(email) {
  const now = Date.now();
  hits.forEach((times, key) => {
    const fresh = times.filter(timestamp => now - timestamp < WINDOW_MS);
    if (fresh.length) hits.set(key, fresh);
    else hits.delete(key);
  });
  const total = [...hits.values()].reduce((count, times) => count + times.length, 0);
  const own = hits.get(email) || [];
  if (total >= TOTAL || own.length >= PER_EMAIL) return true;
  hits.set(email, [...own, now]);
  return false;
}

export async function handleSendPasswordReset(auth, request, response) {
  const ok = () => sendJson(response, 200, { success: true });
  try {
    if (!mailerReady()) return sendJson(response, 503, { success: false, error: 'mailer-unconfigured' });
    const { email, locale } = await readJson(request);
    const address = String(email || '').trim().toLowerCase();
    if (!address || !address.includes('@') || rateLimited(address)) return ok();
    const user = await auth.getUserByEmail(address).catch(() => null);
    if (!user || !user.providerData.some(provider => provider.providerId === 'password')) return ok();
    await sendAuthMailFor(auth, user, { kind: 'reset', lang: pickLang(locale) });
    ok();
  } catch (error) {
    console.error('[send-password-reset] hata:', error.message);
    sendJson(response, 500, { success: false, error: error.message });
  }
}
