import { getNextReads } from '@/features/story/services/nextReads';
import { loadDiscoverStories } from '@/features/story/services/discover';
import { useAppSelector } from '@/store/hooks';
import { Story } from '@/types';
import { useEffect, useMemo, useRef } from 'react';

/**
 * Biten hikâyeye benzeyen sonraki okumaları verir.
 *
 * Aday havuzu bellekteki `discoverStories`'tir; ana sayfa açıldıysa zaten
 * doludur. Doğrudan derin bağlantıyla okuyucuya düşen kullanıcıda boş
 * olabileceği için bir kez doldurulur — bu, dış sisteme (Firestore) yapılan
 * tek seferlik bir çağrı olduğu için effect'in meşru kullanımı.
 */
export function useNextReads(finished: Story | null, limit = 6): Story[] {
  const candidates = useAppSelector(s => s.story.discoverStories);
  const viewerId = useAppSelector(s => s.auth.user?.id);
  const requested = useRef(false);

  useEffect(() => {
    if (!finished || candidates.length > 0 || requested.current) return;
    requested.current = true;
    loadDiscoverStories().catch(() => {
      // Öneri ikincil bir bölüm; başarısız olursa sessizce gizlenir.
      requested.current = false;
    });
  }, [finished, candidates.length]);

  return useMemo(() => {
    if (!finished || candidates.length === 0) return [];
    return getNextReads(candidates, finished, { viewerId, limit });
  }, [candidates, finished, viewerId, limit]);
}
