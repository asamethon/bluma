import { getRecommendations } from '@/features/story/services/recommendations';
import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import type { Story } from '@/types';
import { useMemo } from 'react';
import { buildHomeSections, type HomeSection } from '../services/homeSections';

/**
 * Ana sayfa bölümleri: görünür hikâye havuzu + kişisel sinyaller → sıralı,
 * birbirini tekrar etmeyen bölüm listesi. Hesap saf fonksiyonda
 * (`buildHomeSections`), burada yalnızca store'dan dar dilimler seçilir.
 */
export function useHomeSections(pool: Story[], following: Story[], guest: boolean): HomeSection[] {
  const userId = useAppSelector(state => state.auth.user?.id);
  const interests = useAppSelector(state => state.auth.user?.interests);
  const likedStories = useAppSelector(state => state.story.likedStories);
  const continueReading = useAppSelector(state => state.story.continueReading);

  return useMemo(() => buildHomeSections({
    pool,
    continueReading: guest ? [] : continueReading,
    following: guest ? [] : following,
    recommend: candidates => (userId
      ? getRecommendations(candidates, {
        likedStories,
        readingStories: continueReading.map(entry => entry.story),
        interests: interests || [],
        userId,
      }, i18n.language)
      : []),
  }), [continueReading, following, guest, interests, likedStories, pool, userId]);
}
