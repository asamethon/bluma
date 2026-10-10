import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mailerReady } from './mailer.js';
import { pickLang, sendAuthMailFor } from './authEmailCore.js';
import { readJson, sendJson } from './httpJson.js';

const templateDirectory = join(dirname(fileURLToPath(import.meta.url)), 'templates');

export async function handleSendAuthEmail(auth, request, response) {
  try {
    if (!mailerReady()) return sendJson(response, 503, { success: false, error: 'mailer-unconfigured' });
    const authorization = request.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return sendJson(response, 401, { success: false, error: 'Bearer <idToken> gerekli' });
    const decoded = await auth.verifyIdToken(token);
    const user = await auth.getUser(decoded.uid);
    if (!user.email) return sendJson(response, 400, { success: false, error: 'Hesapta e-posta yok' });
    const { kind = 'verify', newEmail, locale } = await readJson(request);
    if (kind === 'verify' && user.emailVerified) {
      return sendJson(response, 200, { success: true, alreadyVerified: true });
    }
    await sendAuthMailFor(auth, user, { kind, lang: pickLang(locale), newEmail });
    sendJson(response, 200, { success: true });
  } catch (error) {
    console.error('[send-auth-email] hata:', error.message);
    sendJson(response, 500, { success: false, error: error.message });
  }
}

export async function handleActionPage(_request, response) {
  try {
    const html = await readFile(join(templateDirectory, 'action.html'), 'utf8');
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(html);
  } catch (error) {
    console.error('[auth/action] sayfa okunamadı:', error.message);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Sayfa yüklenemedi');
  }
}
