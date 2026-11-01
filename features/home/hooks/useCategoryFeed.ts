import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { useCallback, useMemo, useReducer } from 'react';
import { sortByCategorySort, type CategorySort } from '../services/categoryRanking';

type State = { category: string | null; sort: CategorySort; loadingMore: boolean; hasMore: boolean };
type Action =
  | { type: 'select'; value: string | null }
  | { type: 'sort'; value: CategorySort }
  | { type: 'loading'; value: boolean }
  | { type: 'hasMore'; value: boolean };

const reducer = (state: State, action: Action): State => {
  // Tür değişince sıralama başa döner: her türe "Popüler" ile girilir.
  if (action.type === 'select') return { category: action.value, sort: 'hot', loadingMore: false, hasMore: true };
  if (action.type === 'sort') return { ...state, sort: action.value };
  if (action.type === 'loading') return { ...state, loadingMore: action.value };
  return { ...state, hasMore: action.value };
};

export function useCategoryFeed(stories: Story[]) {
  const [state, dispatch] = useReducer(reducer, { category: null, sort: 'hot', loadingMore: false, hasMore: true });
  const selectedStories = useMemo(() => (state.category
    ? sortByCategorySort(stories.filter(story => story.category === state.category), state.sort)
    : null), [state.category, state.sort, stories]);
  const select = useCallback((category: string | null) => {
    dispatch({ type: 'select', value: category === state.category ? null : category });
  }, [state.category]);
  const loadMore = useCallback(async () => {
    if (!selectedStories || state.loadingMore || !state.hasMore) return;
    dispatch({ type: 'loading', value: true });
    try {
      dispatch({ type: 'hasMore', value: await storyActions.loadMoreStories() });
    } finally {
      dispatch({ type: 'loading', value: false });
    }
  }, [selectedStories, state.hasMore, state.loadingMore]);

  const setSort = useCallback((value: CategorySort) => dispatch({ type: 'sort', value }), []);

  return { ...state, loadMore, select, setSort, stories: selectedStories };
}
