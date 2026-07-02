import { observable } from '@legendapp/state';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '@/types';

const MATURE_KEY = 'pref_showMatureContent';

export interface PreferencesState {
  showMatureContent: boolean;
  loaded: boolean;
}

export const preferencesState$ = observable<PreferencesState>({
  showMatureContent: false,
  loaded: false,
});

export const preferencesActions = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(MATURE_KEY);
      preferencesState$.showMatureContent.set(raw === 'true');
    } catch {
      // sessizce varsayılanda kal
    } finally {
      preferencesState$.loaded.set(true);
    }
  },

  async setShowMatureContent(value: boolean) {
    preferencesState$.showMatureContent.set(value);
    try {
      await AsyncStorage.setItem(MATURE_KEY, value ? 'true' : 'false');
    } catch {}
  },

  // Olgun (18+) içerik tercihi kapalıysa adult hikâyeleri akıştan çıkar.
  filterMature<T extends Pick<Story, 'targetAudience'>>(items: T[]): T[] {
    if (preferencesState$.showMatureContent.get()) return items;
    return items.filter(it => it.targetAudience !== 'adult');
  },
};
