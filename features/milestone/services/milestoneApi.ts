import { store } from '@/store';
import { setMilestone } from '@/store/slices/milestoneSlice';
import { logger } from '@/utils/logger';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { MILESTONE_ID } from '../constants';
import type { Milestone } from '../types';
import { parseMilestone } from '../utils/parseMilestone';

const inflight = { promise: null as Promise<Milestone | null> | null };

/**
 * Kutlama belgesini oturum başına bir kez okur. Hata durumunda `loaded`
 * işaretlenmez: bir sonraki açılış yeniden dener, kullanıcıya hata gösterilmez.
 */
export function loadMilestone(): Promise<Milestone | null> {
  const state = store.getState().milestone;
  if (state.loaded) return Promise.resolve(state.current);
  if (inflight.promise) return inflight.promise;
  inflight.promise = getDoc(doc(getFirestore(), 'milestones', MILESTONE_ID))
    .then(snap => {
      const milestone = snap.exists() ? parseMilestone(snap.id, snap.data()) : null;
      store.dispatch(setMilestone(milestone));
      return milestone;
    })
    .catch(error => {
      logger.debug('Kutlama belgesi okunamadı', error);
      return null;
    })
    .finally(() => { inflight.promise = null; });
  return inflight.promise;
}
