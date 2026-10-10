import { storyActions } from '@/store/storyStore';
import { useCallback, useEffect, useRef, useState } from 'react';

type ChapterLike = { liked: boolean; count: number };
type Chapter = Awaited<ReturnType<typeof storyActions.getChapterWithOfflineFallback>>;

type Params = {
  storyId: string;
  chapterIndex: number;
  /** Bölümler alt koleksiyonda değilse içerik hikâye dokümanından gelir. */
  enabled: boolean;
  isGuest: boolean;
};

/** Bölüm metnini getirir, komşu bölümleri ön belleğe alır ve beğeni durumunu okur. */
export function useChapterContent({ storyId, chapterIndex, enabled, isGuest }: Params) {
  const [body, setBody] = useState<string | null>(null);
  const [like, setLike] = useState<ChapterLike | null>(null);
  const cache = useRef(new Map<number, Promise<Chapter>>());

  const fetchChapter = useCallback((index: number) => {
    const cached = cache.current.get(index);
    if (cached) return cached;
    const request = storyActions.getChapterWithOfflineFallback(storyId, index).catch(() => null);
    cache.current.set(index, request);
    return request;
  }, [storyId]);

  const resetCache = useCallback(() => cache.current.clear(), []);

  useEffect(() => {
    if (!enabled) return;
    const lifecycle = { active: true };
    if (!cache.current.has(chapterIndex)) setBody(null);
    void fetchChapter(chapterIndex).then(chapter => {
      if (lifecycle.active) setBody(chapter?.content || '');
    });
    // Komşu bölümler önden çekilir ki ileri/geri geçiş anlık olsun.
    [chapterIndex - 1, chapterIndex + 1]
      .filter(index => index >= 0)
      .forEach(index => { void fetchChapter(index); });
    return () => { lifecycle.active = false; };
  }, [chapterIndex, enabled, fetchChapter]);

  useEffect(() => {
    if (!enabled || isGuest) {
      setLike(null);
      return;
    }
    const lifecycle = { active: true };
    void Promise.all([fetchChapter(chapterIndex), storyActions.isChapterLiked(storyId, chapterIndex)])
      .then(([chapter, liked]) => {
        if (lifecycle.active) setLike({ liked, count: chapter?.likesCount || 0 });
      });
    return () => { lifecycle.active = false; };
  }, [chapterIndex, enabled, fetchChapter, isGuest, storyId]);

  return { body, like, setLike, resetCache };
}
