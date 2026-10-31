import { useGuestGate } from '@/contexts/GuestContext';
import { buildChapterList } from '@/features/story/utils/readerContent';
import type { Story } from '@/types';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type Params = {
  story: Story | null;
  /** Bölümler alt koleksiyonda değilse metin içinden bölünmüş parça sayısı. */
  legacyCount: number;
  chapterIndex: number;
  isGuest: boolean;
  selectChapter: (index: number) => void;
  onNavigated: () => void;
};

/**
 * Bölüm künyeleri ve bölümler arası gezinme. Ekran yalnızca "git" der;
 * sınır kontrolü, misafir kapısı ve görev sayacı burada durur.
 */
export function useReaderChapters(params: Params) {
  const { t } = useTranslation();
  const { requireAuth } = useGuestGate();
  const { story, legacyCount, chapterIndex, isGuest } = params;

  const total = story?.chaptersInSubcollection
    ? story.chapterTitles?.length || story.chaptersCount || 1
    : legacyCount || 1;
  const chapters = useMemo(
    () => buildChapterList(story?.chapterTitles, total),
    [story?.chapterTitles, total],
  );

  const titleOf = useCallback(
    (index: number) => chapters[index]?.title || t('story.chapterN', { number: index + 1 }),
    [chapters, t],
  );

  const { onNavigated, selectChapter } = params;
  const goTo = useCallback((index: number) => {
    if (isGuest) {
      requireAuth('read');
      return;
    }
    if (index < 0 || index >= total || index === chapterIndex) return;
    // Görev sayımı gezinmede değil, bölüm SONUNDA yapılır (useReadingMilestones).
    selectChapter(index);
    onNavigated();
  }, [chapterIndex, isGuest, onNavigated, requireAuth, selectChapter, total]);

  return {
    chapters,
    total,
    title: titleOf(chapterIndex),
    titleOf,
    goTo,
    hasNext: chapterIndex < total - 1,
    hasPrevious: chapterIndex > 0,
  };
}
