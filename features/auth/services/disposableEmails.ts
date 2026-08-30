/**
 * Tek kullanımlık ("10 dakikalık") e-posta sağlayıcıları.
 *
 * Tek başına yeterli DEĞİLDİR — liste hiçbir zaman tam olmaz ve bu kutular
 * doğrulama postasını alabilir. Asıl kapı e-posta doğrulamasıdır
 * (emailVerification.ts); bu liste yalnızca en tembel yolu kapatır.
 */
const DISPOSABLE_DOMAINS = new Set([
  '0-mail.com', '10minutemail.com', '20minutemail.com', '33mail.com',
  'anonbox.net', 'byom.de', 'dispostable.com', 'dropmail.me',
  'einrot.com', 'emailondeck.com', 'fakeinbox.com', 'fakemail.net',
  'getairmail.com', 'getnada.com', 'guerrillamail.com', 'guerrillamail.info',
  'harakirimail.com', 'inboxbear.com', 'incognitomail.com', 'jetable.org',
  'mail-temporaire.fr', 'mail7.io', 'mailcatch.com', 'maildrop.cc',
  'mailinator.com', 'mailnesia.com', 'mailsac.com', 'mintemail.com',
  'mohmal.com', 'moakt.com', 'mytemp.email', 'nowmymail.com',
  'sharklasers.com', 'spam4.me', 'spamgourmet.com', 'temp-mail.io',
  'temp-mail.org', 'tempail.com', 'tempinbox.com', 'tempmail.dev',
  'tempmail.plus', 'tempmailo.com', 'throwawaymail.com', 'trashmail.com',
  'trashmail.de', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
]);

/** Apple "E-postamı Gizle" adresleri GERÇEKTİR — asla engellenmez. */
export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
