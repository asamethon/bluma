/* eslint-disable import/no-named-as-default-member */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import id from './locales/id.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ptBR from './locales/pt-BR.json';
import pt from './locales/pt.json';
import tr from './locales/tr.json';
import zh from './locales/zh.json';

export const SUPPORTED_LANGUAGES = [
  'en', 'tr', 'es', 'ar', 'de', 'pt', 'pt-BR', 'id', 'ja', 'ko', 'zh',
] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'bluma.language';

function detectDeviceLanguage(): AppLanguage {
  for (const locale of getLocales()) {
    const tag = locale.languageTag as AppLanguage;
    if (SUPPORTED_LANGUAGES.includes(tag)) return tag;
    const code = locale.languageCode as AppLanguage;
    if (code && SUPPORTED_LANGUAGES.includes(code)) return code;
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
    id: { translation: id },
    ja: { translation: ja },
    ko: { translation: ko },
    pt: { translation: pt },
    'pt-BR': { translation: ptBR },
    tr: { translation: tr },
    zh: { translation: zh },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored && stored !== i18n.language) i18n.changeLanguage(stored);
  })
  .catch(() => {});

export async function setAppLanguage(lang: AppLanguage) {
  await i18n.changeLanguage(lang);
  AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
}

export default i18n;
