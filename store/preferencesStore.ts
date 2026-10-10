import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '@/types';
import { store } from './index';
import { patchPreferences } from './slices/preferencesSlice';
import type { ReadingFont, ReadingLineSpacing, ReadingTheme } from './slices/preferencesSlice';
import { logger } from '@/utils/logger';

export type {  ReadingFont, ReadingLineSpacing, ReadingTheme } from './slices/preferencesSlice';

const MATURE_KEY = 'pref_showMatureContent';
const READING_THEME_KEY = 'pref_readingTheme';
const READING_FONT_KEY = 'pref_readingFont';
const READING_LINE_SPACING_KEY = 'pref_readingLineSpacing';
const READING_FONT_SIZE_KEY = 'pref_readingFontSize';

/** Okuma puntosu sınırları — altında satır kırılıyor, üstünde sayfa kırpıyor. */
export const READING_FONT_SIZE = { min: 15, max: 26, step: 1, default: 19 } as const;

export function getReadingPalette(theme: ReadingTheme) {
  switch (theme) {
    case 'sepia':
      return { background: '#F4ECD8', surface: '#EFE4CC', text: '#3B2F1E', textSecondary: '#6B5D45', border: '#DCCBA5' };
    case 'dark':
      return { background: '#1C1C1E', surface: '#242426', text: '#EDEDED', textSecondary: '#A0A0A5', border: '#3A3A3C' };
    case 'black':
      return { background: '#000000', surface: '#0A0A0A', text: '#E6E6E6', textSecondary: '#8A8A8E', border: '#1F1F1F' };
    case 'light':
    default:
      return null;
  }
}

export const READING_LINE_HEIGHT_MULTIPLIER: Record<ReadingLineSpacing, number> = {
  compact: 1.4,
  normal: 1.7,
  relaxed: 2.0,
};

const clampFontSize = (value: number) => Math.max(
  READING_FONT_SIZE.min,
  Math.min(READING_FONT_SIZE.max, Math.round(value)),
);

export const preferencesActions = {
  async load() {
    try {
      const [mature, readingTheme, readingFont, readingLineSpacing, readingFontSize] = await Promise.all([
        AsyncStorage.getItem(MATURE_KEY),
        AsyncStorage.getItem(READING_THEME_KEY),
        AsyncStorage.getItem(READING_FONT_KEY),
        AsyncStorage.getItem(READING_LINE_SPACING_KEY),
        AsyncStorage.getItem(READING_FONT_SIZE_KEY),
      ]);
      store.dispatch(patchPreferences({
        showMatureContent: mature === 'true',
        readingTheme: (readingTheme as ReadingTheme) || 'light',
        readingFont: (readingFont as ReadingFont) || 'serif',
        readingLineSpacing: (readingLineSpacing as ReadingLineSpacing) || 'normal',
        readingFontSize: clampFontSize(Number(readingFontSize) || READING_FONT_SIZE.default),
      }));
    } catch (e) {
      logger.error('Preferences load error:', e);
    } finally {
      store.dispatch(patchPreferences({ loaded: true }));
    }
  },

  async setShowMatureContent(value: boolean) {
    store.dispatch(patchPreferences({ showMatureContent: value }));
    try {
      await AsyncStorage.setItem(MATURE_KEY, value ? 'true' : 'false');
    } catch {}
  },

  async setReadingTheme(value: ReadingTheme) {
    store.dispatch(patchPreferences({ readingTheme: value }));
    try {
      await AsyncStorage.setItem(READING_THEME_KEY, value);
    } catch {}
  },

  async setReadingFont(value: ReadingFont) {
    store.dispatch(patchPreferences({ readingFont: value }));
    try {
      await AsyncStorage.setItem(READING_FONT_KEY, value);
    } catch {}
  },

  async setReadingLineSpacing(value: ReadingLineSpacing) {
    store.dispatch(patchPreferences({ readingLineSpacing: value }));
    try {
      await AsyncStorage.setItem(READING_LINE_SPACING_KEY, value);
    } catch {}
  },

  async setReadingFontSize(value: number) {
    const size = clampFontSize(value);
    store.dispatch(patchPreferences({ readingFontSize: size }));
    try {
      await AsyncStorage.setItem(READING_FONT_SIZE_KEY, String(size));
    } catch {}
  },

  filterMature<T extends Pick<Story, 'targetAudience'>>(
    items: T[],
    showMature?: boolean,
    guest?: boolean
  ): T[] {
    const showMatureContent = showMature ?? store.getState().preferences.showMatureContent;
    const isGuest = guest ?? store.getState().auth.isGuest;
    if (showMatureContent && !isGuest) return items;
    return items.filter(it => it.targetAudience !== 'adult');
  },
};
