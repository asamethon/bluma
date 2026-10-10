import { privacyActions } from '@/features/privacy/services/privacyService';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useMemo, useReducer } from 'react';

type State = { stories: Story[]; activeIndex: number; loading: boolean };
type Action =
  | { type: 'stories'; value: Story[]; loading?: boolean }
  | { type: 'active'; value: number }
  | { type: 'loading'; value: boolean };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'stories') return { ...state, stories: action.value, activeIndex: 0, loading: action.loading ?? state.loading };
  if (action.type === 'active') return { ...state, activeIndex: action.value };
  return { ...state, loading: action.value };
};

const relatedStories = (selected: Story | null, stories: Story[]) => stories
  .filter(story => story.id !== selected?.id && (!selected?.category || story.category === selected.category))
  .slice(0, 10);

export function useStoryPreview(storyId: string) {
  const [state, dispatch] = useReducer(reducer, { stories: [], activeIndex: 0, loading: true });
  const followingIds = useAppSelector(s => s.privacy.followingIds);
  const select = useCallback((index: number) => dispatch({ type: 'active', value: index }), []);

  useEffect(() => {
    const lifecycle = { active: true };
    // Derin bağlantıyla doğrudan buraya düşüldüğünde takip listesi henüz
    // yüklenmemiş olabilir; gizli hesap filtresi ona dayandığı için doldurulur.
    const rootState = store.getState();
    if (rootState.auth.user?.id && !rootState.privacy.loaded) void privacyActions.load();
    const snapshot = rootState.story;
    const availableStories = snapshot.stories || [];
    const memory = [...snapshot.stories, ...snapshot.userStories, ...snapshot.publishedUserStories]
      .find(story => story.id === storyId) || null;
    if (memory) {
      dispatch({ type: 'stories', value: [memory, ...relatedStories(memory, availableStories)], loading: false });
    } else dispatch({ type: 'loading', value: true });

    void storyActions.getStoryWithOfflineFallback(storyId).then(fresh => {
      if (!lifecycle.active) return;
      dispatch({
        type: 'stories',
        value: fresh ? [fresh, ...relatedStories(fresh, availableStories)] : relatedStories(null, availableStories),
        loading: false,
      });
    }).catch(error => {
      logger.error('Error loading story:', error);
      if (lifecycle.active) dispatch({ type: 'loading', value: false });
    });
    return () => { lifecycle.active = false; };
  }, [storyId]);

  // Gizli hesapların hikâyeleri, takipçisi olmayana karuselde listelenmez.
  // Doğrudan açılan hikâye listede kalır: ekran onun için kilit uyarısı gösterir.
  const stories = useMemo(() => {
    const primary = state.stories.find(story => story.id === storyId);
    const related = privacyActions.filterPrivateContent(
      state.stories.filter(story => story.id !== storyId),
      followingIds,
    );
    return primary ? [primary, ...related] : related;
  }, [followingIds, state.stories, storyId]);
  const activeIndex = Math.min(state.activeIndex, Math.max(stories.length - 1, 0));

  return {
    ...state,
    stories,
    activeIndex,
    current: stories[activeIndex] || null,
    select,
  };
}
