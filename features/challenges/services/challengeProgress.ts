import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { store } from '@/store';
import {
  beginChallenges, queueChallenge, resetChallenges, selectChallengeView, settleChallenge,
} from '@/store/slices/challengeSlice';
import { logger } from '@/utils/logger';
import { getAuth } from '@react-native-firebase/auth';
import type { Tracker } from '../definitions';
import { todayKey, weekendStatus, weekStartKey } from './challengeCalendar';
import { persistChallengeOperation } from './challengeRepository';
import { isTrackNoop, type ChallengeOperation } from './challengeState';

type Session = { userId: string; tail: Promise<void>; loading?: Promise<void>; loadedDay?: string };
const runtime = { session: null as Session | null, nextId: 0 };

function hasIdentity(userId: string) {
  const auth = store.getState().auth;
  return auth.isAuthenticated && !auth.isGuest && auth.user?.id === userId && getAuth().currentUser?.uid === userId;
}
function isCurrent(session: Session) {
  return runtime.session === session && hasIdentity(session.userId);
}
function resetSession() {
  runtime.session = null;
  store.dispatch(resetChallenges());
}
function sessionFor(userId: string) {
  if (!hasIdentity(userId)) return null;
  if (runtime.session?.userId !== userId) {
    runtime.session = { userId, tail: Promise.resolve() };
    store.dispatch(beginChallenges(userId));
  }
  return runtime.session;
}

/** Yazımlar sıralıdır; bekleyen aksiyonlar Redux selector'larında anında görünür. */
function enqueue(session: Session, operation?: ChallengeOperation): Promise<void> {
  const id = ++runtime.nextId;
  if (operation) store.dispatch(queueChallenge({ id, operation }));
  const task = session.tail.then(async () => {
    if (!isCurrent(session)) return;
    try {
      const result = await persistChallengeOperation(session.userId, operation, () => isCurrent(session));
      if (!isCurrent(session)) return;
      session.loadedDay = result.data.lastActiveDate;
      store.dispatch(settleChallenge({ id, data: result.data }));
      if (result.completed) void reviewPromptActions.recordMoment('challengeCompleted').catch(() => {});
    } catch (error) {
      if (!isCurrent(session)) return;
      // Yalnız başarısız aksiyon geri alınır; sıradaki optimistic aksiyon korunur.
      store.dispatch(settleChallenge({ id }));
      logger.error('Görev ilerlemesi kaydedilemedi:', error);
    }
  });
  session.tail = task;
  return task;
}

function loadProgress(userId: string): Promise<void> {
  const session = sessionFor(userId);
  if (!session || session.loadedDay === todayKey()) return Promise.resolve();
  if (session.loading) return session.loading;
  session.loading = enqueue(session).finally(() => { session.loading = undefined; });
  return session.loading;
}
/**
 * `key` aksiyonun kimliğidir (bölüm, hikâye, kullanıcı, gün); aynı anahtar
 * bir görevde ikinci kez sayılmaz. Hafta sonu penceresi aksiyonun kuyruğa
 * girdiği an belirlenir — Pazar gece yarısına sarkan yazım da sayılır.
 */
function trackAction(userId: string, tracker: Tracker, key: string): Promise<void> {
  if (!key) return Promise.resolve();
  const session = sessionFor(userId);
  if (!session) return Promise.resolve();
  const weekend = weekendStatus().active;
  // Zaten sayılmış aksiyon için sunucuya transaction açılmaz (okuyucu her
  // kaydırmada aynı bölümü bildirir).
  // Yalnızca bu haftanın verisiyle karar verilir: hafta dönümünde eski
  // haftanın anahtarı yeni haftada yeniden sayılmalıdır.
  const view = selectChallengeView(store.getState());
  const current = store.getState().challenge.isLoaded && view.challengeWeekStart === weekStartKey();
  if (current && isTrackNoop(view, tracker, key, weekend)) return Promise.resolve();
  return enqueue(session, { kind: 'track', tracker, key, weekend });
}
function claimChallenge(userId: string, challengeId: string): Promise<void> {
  const session = sessionFor(userId);
  return session ? enqueue(session, { kind: 'claim', challengeId }) : Promise.resolve();
}
export const challengeActions = { loadProgress, trackAction, claimChallenge, resetSession };
