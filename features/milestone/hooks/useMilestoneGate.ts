import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { loadMilestone } from '../services/milestoneApi';
import { hasSeenMilestone, markMilestoneSeen } from '../services/milestoneSeen';
import { isMilestoneLive } from '../utils/parseMilestone';

/**
 * Kökte bir kez kurulur. Açılış perdesi kalktıktan sonra, giriş yapmış ve
 * onboarding'i bitmiş kullanıcıya kutlama kartını cihaz başına BİR KEZ açar.
 * Bayrak Firestore'da (`milestones/1k.active`) durduğu için açıp kapatmak
 * için sürüm gerekmez.
 */
export function useMilestoneGate(appReady: boolean) {
  const router = useRouter();
  const eligible = useAppSelector(s =>
    s.auth.sessionResolved && s.auth.isAuthenticated && s.auth.hasCompletedOnboarding && !s.auth.isGuest);

  useEffect(() => {
    if (!appReady || !eligible) return;
    const run = { cancelled: false };
    void (async () => {
      const milestone = await loadMilestone();
      if (run.cancelled || !milestone || !isMilestoneLive(milestone, Date.now())) return;
      if ((await hasSeenMilestone(milestone.id)) || run.cancelled) return;
      markMilestoneSeen(milestone.id);
      router.push('/milestone' as never);
    })();
    return () => { run.cancelled = true; };
  }, [appReady, eligible, router]);
}
