import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppSelector } from '@/store/hooks';
import { readingListActions } from '@/store/readingListStore';
import type { Story } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export function useReadingListDetail(listId: string) {
  const { t } = useTranslation();
  const list = useAppSelector(state => state.readingList.lists.find(item => item.id === listId));
  const listsLoaded = useAppSelector(state => state.readingList.loaded);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!listId) return;
    setStories(await readingListActions.getListStories(listId));
    setLoading(false);
  }, [listId]);

  // Liste üstverisi başka ekrandan gelmemişse önce onu getir.
  useEffect(() => {
    if (!listsLoaded) {
      void readingListActions.loadLists().then(load);
      return;
    }
    void load();
  }, [listsLoaded, load, list?.storyIds.length]);

  const { refreshing, onRefresh } = usePullToRefresh(load);

  const confirmRemove = useCallback((storyId: string, title: string) => {
    Alert.alert(t('lists.removeTitle'), t('lists.removeConfirm', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('lists.remove'),
        style: 'destructive',
        onPress: () => {
          void readingListActions.removeStory(listId, storyId);
          setStories(prev => prev.filter(story => story.id !== storyId));
        },
      },
    ]);
  }, [listId, t]);

  return { list, stories, loading, refreshing, onRefresh, confirmRemove };
}
