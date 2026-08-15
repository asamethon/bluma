import { getRecommendations } from '@/features/story/services/recommendations';
import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { Story } from '@/types';
import { useMemo } from 'react';

export function useRecommendations(candidates: Story[], limit = 12): Story[] {
  const userId = useAppSelector(s => s.auth.user?.id);
  const interests = useAppSelector(s => s.auth.user?.interests);
  const likedStories = useAppSelector(s => s.story.likedStories);
  const continueReading = useAppSelector(s => s.story.continueReading);

  return useMemo(() => {
    if (!userId) return [];
    return getRecommendations(
      candidates,
      {
        likedStories,
        readingStories: continueReading.map(r => r.story),
        interests: interests || [],
        userId,
      },
      i18n.language,
      limit
    );
  }, [candidates, likedStories, continueReading, interests, userId, limit]);
}
