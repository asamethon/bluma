import type { Story } from '@/types';
import { useCallback, useMemo, useReducer } from 'react';
import { sortByCategorySort, type CategorySort } from '../services/categoryRanking';

type State = { category: string | null; sort: CategorySort };
type Action = { type: 'select'; value: string | null } | { type: 'sort'; value: CategorySort };

const reducer = (state: State, action: Action): State => (action.type === 'select'
  // Tür değişince sıralama başa döner: her türe "Popüler" ile girilir.
  ? { category: action.value, sort: 'hot' }
  : { ...state, sort: action.value });

export function useCategoryFeed(stories: Story[]) {
  const [state, dispatch] = useReducer(reducer, { category: null, sort: 'hot' });
  const selectedStories = useMemo(() => (state.category
    ? sortByCategorySort(stories.filter(story => story.category === state.category), state.sort)
    : null), [state.category, state.sort, stories]);
  const select = useCallback((category: string | null) => {
    dispatch({ type: 'select', value: category === state.category ? null : category });
  }, [state.category]);
  const setSort = useCallback((value: CategorySort) => dispatch({ type: 'sort', value }), []);

  return { ...state, select, setSort, stories: selectedStories };
}
