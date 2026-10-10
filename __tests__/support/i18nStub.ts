/**
 * Testlerde gerçek i18n (expo-localization → native modül) yüklenmez.
 * Sahte çeviri, anahtarı ve parametreleri okunur biçimde geri verir.
 */
const stub = {
  language: 'tr',
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
};

export default stub;
