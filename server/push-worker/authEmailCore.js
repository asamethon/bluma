import { sendTemplateMail } from './mailer.js';

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

export const pickLang = locale => String(locale || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';

function actionLink(link, lang) {
  const localized = link.includes('lang=') ? link : `${link}&lang=${lang}`;
  const target = process.env.ACTION_PAGE_URL;
  if (!target) return localized;
  try {
    const own = new URL(target);
    own.search = new URL(localized).search;
    return own.toString();
  } catch (error) {
    console.error('[auth-email] işlem sayfası adresi geçersiz:', error.message);
    return localized;
  }
}

export async function sendAuthMailFor(auth, user, { kind = 'verify', lang = 'tr', newEmail } = {}) {
  if (kind === 'change') {
    if (!newEmail) throw new Error('newEmail gerekli');
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
