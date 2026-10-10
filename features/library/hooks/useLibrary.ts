import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type LibrarySection = { title: string; data: Story[] };

/** En son beğenilenlerden kitaplıkta gösterilen sayı. */
const LIKED_PREVIEW_COUNT = 10;

export function useLibrary() {
  const { t } = useTranslation();
  const userId = useAppSelector(state => state.auth.user?.id);
  const savedStories = useAppSelector(state => state.story.savedStories);
  const likedStories = useAppSelector(state => state.story.likedStories);

  useFocusEffect(useCallback(() => {
    if (userId) storyActions.initializeRealTimeListeners();
  }, [userId]));

  const reload = useCallback(
    () => (userId
      ? Promise.all([storyActions.loadSavedStories(), storyActions.loadLikedStories()])
      : Promise.resolve()),
    [userId],
  );
  const { refreshing, onRefresh } = usePullToRefresh(reload);

  const sections = useMemo(() => {
    const list: LibrarySection[] = [];
    if (savedStories.length) list.push({ title: t('library.saved'), data: savedStories });
    if (likedStories.length) {
      list.push({
        title: t('library.liked'),
        data: likedStories.slice(0, LIKED_PREVIEW_COUNT),
      });
    }
    return list;
  }, [savedStories, likedStories, t]);

  return { sections, refreshing, onRefresh };
}
