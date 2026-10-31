import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * `route`: bölümün tamamını gösteren ve kaldırma/düzenleme sunan ekran.
 * Kitaplık beğenilenlerin yalnızca son 10'unu gösterdiği için "Tümü"
 * olmadan geri kalanına ulaşılamıyordu.
 */
export type LibrarySection = { title: string; data: Story[]; route: '/profile/saved' | '/profile/favorites' };

/** En son beğenilenlerden kitaplıkta gösterilen sayı. */
const LIKED_PREVIEW_COUNT = 10;

export function useLibrary() {
  const { t } = useTranslation();
  const userId = useAppSelector(state => state.auth.user?.id);
  const savedStories = useAppSelector(state => state.story.savedStories);
  const likedStories = useAppSelector(state => state.story.likedStories);

  // Yalnızca kitaplık dinleyicileri (tekil). Eskiden burada bütün akış
  // başlatıcısı çağrılıyordu ve sekmeye her dönüş ~100+ okuma demekti.
  useFocusEffect(useCallback(() => {
    if (userId) storyActions.setupStoryLibraryListeners();
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
    if (savedStories.length) list.push({ title: t('library.saved'), data: savedStories, route: '/profile/saved' });
    if (likedStories.length) {
      list.push({
        title: t('library.liked'),
        data: likedStories.slice(0, LIKED_PREVIEW_COUNT),
        route: '/profile/favorites',
      });
    }
    return list;
  }, [savedStories, likedStories, t]);

  return { sections, refreshing, onRefresh };
}
