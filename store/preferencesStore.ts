import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '@/types';
import { store } from './index';
import { patchPreferences } from './slices/preferencesSlice';
import type { ReadingFont, ReadingLineSpacing, ReadingTheme } from './slices/preferencesSlice';

export type { PreferencesState, ReadingFont, ReadingLineSpacing, ReadingTheme } from './slices/preferencesSlice';

const MATURE_KEY = 'pref_showMatureContent';
const READING_THEME_KEY = 'pref_readingTheme';
const READING_FONT_KEY = 'pref_readingFont';
const READING_LINE_SPACING_KEY = 'pref_readingLineSpacing';

// Okuma teması, uygulamanın genel (sistem) temasından bağımsız — okuyucuya
// özgü bir tercih. 'light' varsayılanı, ekranın normal `useTheme()` renklerini
// kullanmaya devam etmesi için `null` döner (davranış değişmez).
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

export const preferencesActions = {
  async load() {
    try {
      const [mature, readingTheme, readingFont, readingLineSpacing] = await Promise.all([
        AsyncStorage.getItem(MATURE_KEY),
        AsyncStorage.getItem(READING_THEME_KEY),
        AsyncStorage.getItem(READING_FONT_KEY),
        AsyncStorage.getItem(READING_LINE_SPACING_KEY),
      ]);
      store.dispatch(patchPreferences({
        showMatureContent: mature === 'true',
        readingTheme: (readingTheme as ReadingTheme) || 'light',
        readingFont: (readingFont as ReadingFont) || 'serif',
        readingLineSpacing: (readingLineSpacing as ReadingLineSpacing) || 'normal',
      }));
    } catch {
      // sessizce varsayılanda kal
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

  // Olgun (18+) içerik tercihi kapalıysa adult hikâyeleri akıştan çıkar.
  // Misafirler için tercih ne olursa olsun 18+ içerik gizlenir — aksi hâlde
  // cihazdaki tercih (AsyncStorage, hesap-bağımsız) önceki oturumdan sızabilir
  // (bkz. YAPILACAKLAR 2.7).
  filterMature<T extends Pick<Story, 'targetAudience'>>(items: T[]): T[] {
    const { showMatureContent } = store.getState().preferences;
    const { isGuest } = store.getState().auth;
    if (showMatureContent && !isGuest) return items;
    return items.filter(it => it.targetAudience !== 'adult');
  },
};
