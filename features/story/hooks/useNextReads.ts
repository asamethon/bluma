import { getNextReads } from '@/features/story/services/nextReads';
import { useAppSelector } from '@/store/hooks';
import { preferencesActions } from '@/store/preferencesStore';
import { Story } from '@/types';
import { useMemo } from 'react';

/**
 * Biten hikâyeye benzeyen sonraki okumaları verir.
 *
 * Aday havuzu bellekteki ana akıştır (`stories`); açılışta her kullanıcı için
 * zaten yükleniyor, bu yüzden burada ek Firestore okuması yapılmaz.
 */
export function useNextReads(finished: Story | null, limit = 6): Story[] {
  const candidates = useAppSelector(s => s.story.stories);
  const viewerId = useAppSelector(s => s.auth.user?.id);
  const showMature = useAppSelector(s => s.preferences.showMatureContent);
  const isGuest = useAppSelector(s => s.auth.isGuest);

  return useMemo(() => {
    if (!finished || candidates.length === 0) return [];
    // Ana akış ham tutulur; yetişkin içerik tercihi burada da uygulanır.
    const allowed = preferencesActions.filterMature(candidates, showMature, isGuest);
    return getNextReads(allowed, finished, { viewerId, limit });
  }, [candidates, finished, isGuest, limit, showMature, viewerId]);
}
