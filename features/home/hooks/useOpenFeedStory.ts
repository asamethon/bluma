import type { FeedSource } from '@/features/discovery/constants';
import { trackFeedClick } from '@/features/discovery/services/feedEvents';
import type { Story } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Vitrinden hikâye açar ve dokunuşu bölümü + sırasıyla ölçer. Bölüm numarası
 * verilirse okuyucu doğrudan o bölümde açılır (Okumaya Devam Et).
 */
export function useOpenFeedStory() {
  const router = useRouter();
  return useCallback((story: Story, section: FeedSource, position: number, chapterIndex?: number) => {
    trackFeedClick(story.id, section, position);
    router.push((chapterIndex === undefined
      ? `/story/${story.id}/preview`
      : `/story/${story.id}?chapter=${chapterIndex}`) as never);
  }, [router]);
}
