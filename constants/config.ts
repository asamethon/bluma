export const IMAGE_SERVER_URL = 'https://blumaimg.d4tecompany.com';

export const API_SERVER_URL = 'https://bluma-api.d4tecompany.com';

export const SUPPORT_EMAIL = 'asamethon@gmail.com';

export const PRIVACY_POLICY_URL = 'https://sites.google.com/view/bluma-privacy-policy';
export const TERMS_URL = 'https://sites.google.com/view/bluma-terms-and-conditions';

export const META_APP_ID = process.env.EXPO_PUBLIC_META_APP_ID?.trim() || '';

/**
 * KLIPY GIF/çıkartma araması. Anahtar yoksa seçici kapalı kalır.
 * (Tenor API'si Ocak 2026'da yeni anahtar vermeyi bıraktı, Haziran 2026'da
 * kapanıyor; KLIPY ücretsiz ve Tenor'a çok yakın bir servis.)
 */
export const KLIPY_API_KEY = process.env.EXPO_PUBLIC_KLIPY_API_KEY?.trim() || '';
