import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppSelector } from '@/store/hooks';
import { readingListActions } from '@/store/readingListStore';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export function useReadingLists() {
  const { t } = useTranslation();
  const userId = useAppSelector(state => state.auth.user?.id);
  const lists = useAppSelector(state => state.readingList.lists);
  const loaded = useAppSelector(state => state.readingList.loaded);
  const [draftName, setDraftName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (userId) readingListActions.loadLists();
  }, [userId]);

  const { refreshing, onRefresh } = usePullToRefresh(readingListActions.loadLists);

  const create = useCallback(() => {
    const name = draftName.trim();
    if (!name) return;
    void readingListActions.createList(name).then(result => {
      if (!result.success) {
        Alert.alert(t('common.error'), result.error || t('lists.createFailed'));
        return;
      }
      setDraftName('');
      setCreating(false);
    });
  }, [draftName, t]);

  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert(t('lists.deleteTitle'), t('lists.deleteConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => readingListActions.deleteList(id) },
    ]);
  }, [t]);

  return {
    lists,
    loaded,
    isSignedIn: !!userId,
    refreshing,
    onRefresh,
    creating,
    toggleCreating: () => setCreating(open => !open),
    draftName,
    setDraftName,
    create,
    confirmDelete,
  };
}
