import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { store } from '@/store';
import { beginChallenges, queueChallenge, resetChallenges, settleChallenge } from '@/store/slices/challengeSlice';
import { logger } from '@/utils/logger';
import { getAuth } from '@react-native-firebase/auth';
import { CHALLENGE_DEFS, type Tracker } from '../definitions';
import { todayKey } from './challengeCalendar';
import { persistChallengeOperation } from './challengeRepository';
import type { ChallengeOperation } from './challengeState';

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
function trackAction(userId: string, tracker: Tracker, amount = 1): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0 || !CHALLENGE_DEFS.some(def => def.tracker === tracker)) return Promise.resolve();
  const session = sessionFor(userId);
  return session ? enqueue(session, { kind: 'track', tracker, amount }) : Promise.resolve();
}
function claimChallenge(userId: string, challengeId: string): Promise<void> {
  const session = sessionFor(userId);
  return session ? enqueue(session, { kind: 'claim', challengeId }) : Promise.resolve();
}
export const challengeActions = { loadProgress, trackAction, claimChallenge, resetSession };
