import en from '../../i18n/locales/en.json';
import tr from '../../i18n/locales/tr.json';

/**
 * Testlerde gerçek i18n (expo-localization → native modül) yüklenmez.
 * Sahte çeviri, anahtarı ve parametreleri okunur biçimde geri verir.
 * Dile özgü metin gereken testler için tr/en kaynakları `getFixedT` ile
 * okunabilir (ör. her dildeki "Adsız hikâye" başlığı).
 */
const resources: Record<string, { translation: object }> = { tr: { translation: tr }, en: { translation: en } };
const lookup = (language: string, key: string): unknown => key.split('.')
  .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], resources[language]?.translation);

const stub = {
  language: 'tr',
  options: { resources },
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  getFixedT: (language: string) => (key: string, params?: Record<string, unknown>) => {
    const text = lookup(language, key);
    return typeof text === 'string' ? text : stub.t(key, params);
  },
};

export default stub;
