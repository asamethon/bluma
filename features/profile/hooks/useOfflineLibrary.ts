import { storyActions } from '@/store/storyStore';
import { useCallback, useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export type StorageInfo = { used: number; total: number; count: number };
type State = { refreshing: boolean; storage: StorageInfo };
const initialState: State = { refreshing: false, storage: { used: 0, total: 0, count: 0 } };
const reducer = (state: State, patch: Partial<State>): State => ({ ...state, ...patch });

export function useOfflineLibrary() {
  const { t } = useTranslation();
  const [state, patch] = useReducer(reducer, initialState);
  const loadStorage = useCallback(() => {
    void storyActions.getOfflineStorageInfo().then(storage => patch({ storage }));
  }, []);
  const refresh = useCallback(() => {
    patch({ refreshing: true });
    void storyActions.loadOfflineStories()
      .then(() => storyActions.getOfflineStorageInfo())
      .then(storage => patch({ storage }))
      .finally(() => patch({ refreshing: false }));
  }, []);
  useEffect(() => {
    void storyActions.loadOfflineStories().then(loadStorage);
  }, [loadStorage]);
  const remove = useCallback((storyId: string, title: string) => {
    Alert.alert(t('studio.deleteStoryTitle'), t('offlineLibrary.deleteConfirm', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => {
        void storyActions.deleteOfflineStory(storyId).then(success => {
          if (success) loadStorage();
          else Alert.alert(t('common.error'), t('offlineLibrary.deleteFailed'));
        });
      } },
    ]);
  }, [loadStorage, t]);
  const clear = useCallback(() => {
    Alert.alert(t('offlineLibrary.clearAllTitle'), t('offlineLibrary.clearAllConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('offlineLibrary.deleteAll'), style: 'destructive', onPress: () => {
        void storyActions.clearAllOfflineData().then(success => {
          if (!success) {
            Alert.alert(t('common.error'), t('offlineLibrary.deleteFailed'));
            return;
          }
          Alert.alert(t('common.success'), t('offlineLibrary.allDeleted'));
          loadStorage();
        });
      } },
    ]);
  }, [loadStorage, t]);
  return { ...state, clear, refresh, remove };
}
