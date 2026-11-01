import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { useCallback, useReducer } from 'react';

type State = { loading: boolean; exhaustedAt: number | null };
type Action = { type: 'loading' } | { type: 'done'; exhaustedAt: number | null };

const reducer = (state: State, action: Action): State => (action.type === 'loading'
  ? { ...state, loading: true }
  : { loading: false, exhaustedAt: action.exhaustedAt });

/**
 * Ana sayfanın sonu yoktur: liste dibe yaklaşınca katalogdan bir sonraki sayfa
 * çekilir ve havuza eklenir (`loadMoreStories`). Tür sayfası da aynı havuzdan
 * beslendiği için aynı kancayı kullanır.
 *
 * `exhaustedAt`, sunucunun "daha yok" dediği andaki havuz boyudur; "bitti"
 * durumunu bir effect'e gerek kalmadan türetir. Aşağı çekip tazeleme havuzu
 * yeniden 50 hikâyeye indirdiğinde boy değişir ve kuyruk kendiliğinden
 * yeniden açılır.
 */
export function useEndlessFeed() {
  const poolSize = useAppSelector(state => state.story.stories.length);
  const [state, dispatch] = useReducer(reducer, { loading: false, exhaustedAt: null });
  const hasMore = state.exhaustedAt === null || state.exhaustedAt !== poolSize;

  const loadMore = useCallback(async () => {
    if (state.loading || !hasMore) return;
    dispatch({ type: 'loading' });
    try {
      const more = await storyActions.loadMoreStories();
      dispatch({ type: 'done', exhaustedAt: more ? null : poolSize });
    } catch {
      dispatch({ type: 'done', exhaustedAt: null });
    }
  }, [hasMore, poolSize, state.loading]);

  return { hasMore, loadingMore: state.loading, loadMore };
}
