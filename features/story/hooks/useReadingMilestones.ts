import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { challengeActions } from '@/store/challengeStore';
import { useAppSelector } from '@/store/hooks';
import type { Story } from '@/types';
import { useCallback, useRef } from 'react';

/** Bölümün "bitti" sayıldığı kaydırma oranı. */
const FINISHED_RATIO = 0.95;

/** Hikâyenin bittiği an: tamamlanmış hikâyenin son bölümü (okuyucu kuyruğuyla aynı tanım). */
function isStoryFinished(story: Pick<Story, 'isCompleted'>, chapterIndex: number, total: number) {
  return story.isCompleted === true && chapterIndex >= total - 1;
}

/**
 * Okuma dönüm noktaları — bölüm sonu ve hikâye sonu. Görev ilerlemesi ile
 * değerlendirme anları buradan beslenir.
 *
 * Sayım sayfa geçişine değil bölümün SONUNA bağlıdır. Eskiden yalnızca
 * "sonraki bölüme" geçiş sayılıyordu: ilk bölüm ve tek bölümlük hikâye hiç
 * sayılmıyor, geri-ileri gezinmek aynı bölümü tekrar sayıyordu. Görev
 * anahtarı (hikâye:bölüm) tekrar okumayı zaten eler; kendi hikâyeni okumak
 * görev doldurmaz.
 */
export function useReadingMilestones({ story, enabled }: { story: Story | null; enabled: boolean }) {
  const userId = useAppSelector(state => state.auth.user?.id);
  const followingIds = useAppSelector(state => state.privacy.followingIds);
  const followingLoaded = useAppSelector(state => state.privacy.loaded);
  // Bu ekranda bildirilmiş bölümler: kaydırma her olayda aynı bölümü sorar,
  // değerlendirme anı ise bölüm başına bir kez sayılmalı.
  const reported = useRef(new Set<string>());

  return useCallback((chapterIndex: number, ratio: number) => {
    if (!enabled || !story || ratio < FINISHED_RATIO) return;
    const key = `${story.id}:${chapterIndex}`;
    if (reported.current.has(key)) return;
    reported.current.add(key);

    const total = story.chapterTitles?.length || story.chaptersCount || 1;
    const finished = isStoryFinished(story, chapterIndex, total);
    reviewPromptActions.recordMoment(finished ? 'storyFinished' : 'chapterFinished').catch(() => {});

    if (!userId || story.authorId === userId) return;
    void challengeActions.trackAction(userId, 'chaptersRead', key);
    if (finished) void challengeActions.trackAction(userId, 'storiesFinished', story.id);
    // Takip listesi yüklenmeden herkes "yeni yazar" görünürdü.
    if (followingLoaded && !followingIds.includes(story.authorId)) {
      void challengeActions.trackAction(userId, 'newAuthorsRead', story.authorId);
    }
  }, [enabled, followingIds, followingLoaded, story, userId]);
}
