import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '@/types';
import { store } from './index';
import { patchPreferences } from './slices/preferencesSlice';

export type { PreferencesState } from './slices/preferencesSlice';

const MATURE_KEY = 'pref_showMatureContent';

export const preferencesActions = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(MATURE_KEY);
      store.dispatch(patchPreferences({ showMatureContent: raw === 'true' }));
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

  // Olgun (18+) içerik tercihi kapalıysa adult hikâyeleri akıştan çıkar.
  filterMature<T extends Pick<Story, 'targetAudience'>>(items: T[]): T[] {
    if (store.getState().preferences.showMatureContent) return items;
    return items.filter(it => it.targetAudience !== 'adult');
  },
};
