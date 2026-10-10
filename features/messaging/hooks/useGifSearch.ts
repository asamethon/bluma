import { fetchGifs, gifSearchEnabled, type GifMedia } from '@/services/gif/klipy';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Her tuşta istek atmamak için bekleme. */
const DEBOUNCE_MS = 350;

type State = { items: GifMedia[]; nextPage: number | null; loading: boolean; error: string | null };
const EMPTY: State = { items: [], nextPage: null, loading: true, error: null };

/**
 * GIF/çıkartma araması: sorgu ya da sekme değiştiğinde liste sıfırdan yüklenir,
 * listenin sonuna gelindiğinde bir sonraki sayfa eklenir.
 */
export function useGifSearch(sticker: boolean) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>(EMPTY);
  // Geç dönen eski istek yeni sonucun üstüne yazmasın.
  const requestId = useRef(0);

  useEffect(() => {
    if (!gifSearchEnabled()) {
      setState({ items: [], nextPage: null, loading: false, error: null });
      return;
    }
    const id = requestId.current + 1;
    requestId.current = id;
    setState(EMPTY);
    const timer = setTimeout(() => {
      fetchGifs({ query, sticker })
        .then(page => {
          if (requestId.current !== id) return;
          setState({ items: page.items, nextPage: page.nextPage, loading: false, error: null });
        })
        .catch((error: Error) => {
          if (requestId.current !== id) return;
          setState({ items: [], nextPage: null, loading: false, error: error.message });
        });
    }, query ? DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [query, sticker]);

  const loadMore = useCallback(() => {
    if (state.loading || !state.nextPage) return;
    const id = requestId.current;
    setState(current => ({ ...current, loading: true }));
    fetchGifs({ query, sticker, page: state.nextPage })
      .then(page => {
        if (requestId.current !== id) return;
        setState(current => ({
          items: [...current.items, ...page.items],
          nextPage: page.nextPage,
          loading: false,
          error: null,
        }));
      })
      .catch(() => setState(current => ({ ...current, loading: false })));
  }, [query, sticker, state.loading, state.nextPage]);

  return { query, setQuery, ...state, loadMore, enabled: gifSearchEnabled() };
}
