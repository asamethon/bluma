import { readParams } from '@/features/discovery/services/feedEvents';
import { useChapterContent } from './useChapterContent';
import { useReadingReviewMoments } from '@/features/review/hooks/useReadingReviewMoments';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import { storyActions } from '@/store/storyStore';
import { useAppSelector } from '@/store/hooks';
import type { Story } from '@/types';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { buildReaderParagraphs, estimateReadingMinutes, splitStoryChapters } from '../utils/readerContent';

type Params = {
  storyId: string;
  requestedChapter?: string;
  isGuest: boolean;
};

const parseInitialChapter = (value: string | undefined, isGuest: boolean) => (
  isGuest ? 0 : Math.max(0, Number.parseInt(value || '0', 10) || 0)
);

export function useReaderStory({ storyId, requestedChapter, isGuest }: Params) {
  const liveStory = useAppSelector(state => state.story.currentStory);
  const [loadedStory, setLoadedStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chapterIndex, setChapterIndex] = useState(() => parseInitialChapter(requestedChapter, isGuest));
  const pendingScrollRatio = useRef<number | null>(null);
  const lastScrollSave = useRef(0);
  const resumedStoryId = useRef<string | null>(null);
  const story = liveStory?.id === storyId ? liveStory : loadedStory;
  const trackReviewMoment = useReadingReviewMoments({
    storyId,
    chapterCount: story?.chapterTitles?.length || story?.chaptersCount || 1,
    enabled: !isGuest,
  });
  const {
    body: chapterBody,
    like: chapterLike,
    setLike: setChapterLike,
    resetCache: resetChapterCache,
  } = useChapterContent({
    storyId,
    chapterIndex,
    enabled: !!story?.chaptersInSubcollection,
    isGuest,
  });

  useEffect(() => {
    const lifecycle = { active: true };
    setIsLoading(true);
    setLoadedStory(null);
    resetChapterCache();
    resumedStoryId.current = null;
    const unsubscribe = storyActions.setupStoryDetailListener(storyId);
    void storyActions.getStoryWithOfflineFallback(storyId).then(value => {
      if (lifecycle.active && value) setLoadedStory(value);
    }).finally(() => {
      if (lifecycle.active) setIsLoading(false);
    });
    void storyActions.incrementStoryViews(storyId);
    void logEvent(getAnalytics(), 'story_read', readParams(storyId));
    return () => {
      lifecycle.active = false;
      unsubscribe?.();
    };
  }, [resetChapterCache, storyId]);

  useEffect(() => {
    if (requestedChapter || isGuest || !story || resumedStoryId.current === storyId) return;
    resumedStoryId.current = storyId;
    void readingProgressActions.getReadingProgress(storyId).then(saved => {
      const maximum = (story.chapterTitles?.length || story.chaptersCount || 1) - 1;
      if (typeof saved?.chapterIndex === 'number') {
        setChapterIndex(Math.max(0, Math.min(saved.chapterIndex, maximum)));
      }
      if (saved?.scrollRatio) pendingScrollRatio.current = saved.scrollRatio;
    });
  }, [isGuest, requestedChapter, story, storyId]);

  const legacyChapters = useMemo(() => (
    !story || story.chaptersInSubcollection
      ? []
      : splitStoryChapters(story.content, story.chapterTitles?.length || story.chaptersCount)
  ), [story]);
  // Bölüm alt koleksiyondan geliyorsa metin gelene kadar `null` durur; bu,
  // "içerik yok" ile "henüz yüklenmedi" ayrımını korur.
  const isChapterLoading = !!story?.chaptersInSubcollection && chapterBody === null;
  const content = story?.chaptersInSubcollection
    ? chapterBody ?? ''
    : legacyChapters[chapterIndex] || story?.content || '';
  const readerContent = useMemo(() => ({
    ...buildReaderParagraphs(content, isGuest),
    readingMinutes: estimateReadingMinutes(content),
  }), [content, isGuest]);

  const selectChapter = useCallback((nextIndex: number) => {
    setChapterIndex(nextIndex);
    if (!isGuest) void readingProgressActions.saveReadingProgress(storyId, nextIndex, 0);
    void logEvent(getAnalytics(), 'chapter_read', { ...readParams(storyId), chapter_index: nextIndex });
  }, [isGuest, storyId]);

  const saveScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isGuest || Date.now() - lastScrollSave.current < 2000) return;
    lastScrollSave.current = Date.now();
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    const ratio = scrollable > 0 ? Math.max(0, Math.min(1, contentOffset.y / scrollable)) : 0;
    void readingProgressActions.saveReadingProgress(storyId, chapterIndex, ratio);
    trackReviewMoment(chapterIndex, ratio);
  }, [chapterIndex, isGuest, storyId, trackReviewMoment]);

  const toggleChapterLike = useCallback(() => {
    if (!chapterLike) return;
    const previous = chapterLike;
    setChapterLike({ liked: !previous.liked, count: Math.max(0, previous.count + (previous.liked ? -1 : 1)) });
    void storyActions.toggleChapterLike(storyId, chapterIndex, previous.liked).then(result => {
      if (!result.success) setChapterLike(previous);
    });
  }, [chapterIndex, chapterLike, setChapterLike, storyId]);

  return {
    chapterBody: content,
    chapterIndex,
    chapterLike,
    isChapterLoading,
    isLoading,
    legacyChapters,
    pendingScrollRatio,
    readerContent,
    saveScroll,
    selectChapter,
    story,
    toggleChapterLike,
  };
}
