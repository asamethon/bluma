import { useCallback, useRef } from 'react';
import { reviewPromptActions } from '@/features/review/services/reviewPrompt';

/** Bölümün "bitti" sayıldığı kaydırma oranı. */
const FINISHED_RATIO = 0.95;

type Params = {
  storyId?: string;
  /** Hikâyedeki toplam bölüm sayısı. */
  chapterCount: number;
  /**
   * Misafir kullanıcıda kapalıdır: misafir bölümün yalnızca ilk iki
   * paragrafını görüp giriş duvarına çarpar, yani bu bir değer anı değil.
   */
  enabled: boolean;
};

/**
 * Okuma ekranındaki değerlendirme anlarını yönetir.
 *
 * Tek başına "hikâyeyi bitirme" ulaşılamayacak kadar nadirdi (bölüm bölüm
 * yayınlanan hikâyelerde okur son bölüme çoğu zaman hiç varmıyor), bu yüzden
 * asıl sinyal bölüm bitirmedir. Hikâyenin tamamını bitirmek daha güçlü bir an
 * olduğu için ayrıca sayılır.
 */
export function useReadingReviewMoments({ storyId, chapterCount, enabled }: Params) {
  // Aynı bölüm tekrar kaydırıldığında ikinci kez sayılmaz.
  const countedChapters = useRef<Set<string>>(new Set());
  const storyCounted = useRef(false);

  return useCallback(
    (chapterIndex: number, ratio: number) => {
      if (!enabled || !storyId || ratio <= FINISHED_RATIO) return;

      const atLastChapter = chapterIndex >= chapterCount - 1;

      if (atLastChapter && !storyCounted.current) {
        storyCounted.current = true;
        reviewPromptActions.recordMoment('storyFinished').catch(() => {});
        return;
      }

      const key = `${storyId}:${chapterIndex}`;
      if (countedChapters.current.has(key)) return;
      countedChapters.current.add(key);
      reviewPromptActions.recordMoment('chapterFinished').catch(() => {});
    },
    [enabled, storyId, chapterCount]
  );
}
