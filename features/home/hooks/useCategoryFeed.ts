import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { useCallback, useMemo, useReducer } from 'react';

type State = { category: string | null; loadingMore: boolean; hasMore: boolean };
type Action =
  | { type: 'select'; value: string | null }
  | { type: 'loading'; value: boolean }
  | { type: 'hasMore'; value: boolean };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'select') return { category: action.value, loadingMore: false, hasMore: true };
  if (action.type === 'loading') return { ...state, loadingMore: action.value };
  return { ...state, hasMore: action.value };
};

export function useCategoryFeed(stories: Story[]) {
  const [state, dispatch] = useReducer(reducer, { category: null, loadingMore: false, hasMore: true });
  const selectedStories = useMemo(() => state.category
    ? stories
      .filter(story => story.category === state.category)
      .sort((left, right) => (right.viewsCount || 0) - (left.viewsCount || 0))
    : null, [state.category, stories]);
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

  return { ...state, loadMore, select, stories: selectedStories };
}
