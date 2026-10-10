import type { Story } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import {
  clearStoredSearchHistory,
  prependUnique,
  readSearchHistory,
  writeSearchHistory,
} from '../services/searchHistory';
import type { SearchHistoryItem } from '../types';

export function useSearchHistory() {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    void readSearchHistory().then(setItems).catch(() => {});
  }, []);

  const add = useCallback((item: SearchHistoryItem) => {
    setItems(current => {
      const next = prependUnique(current, item);
      void writeSearchHistory(next).catch(() => {});
      return next;
    });
  }, []);

  const addQuery = useCallback((query: string) => {
    const normalized = query.trim();
    if (normalized) add({ type: 'query', query: normalized, timestamp: Date.now() });
  }, [add]);

  const addStory = useCallback((story: Story) => {
    add({
      type: 'story', id: story.id, title: story.title,
      image: story.coverImage, timestamp: Date.now(),
    });
  }, [add]);

  const remove = useCallback((index: number) => {
    setItems(current => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      void writeSearchHistory(next).catch(() => {});
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    void clearStoredSearchHistory().catch(() => {});
  }, []);

  return { items, addQuery, addStory, remove, clear };
}
