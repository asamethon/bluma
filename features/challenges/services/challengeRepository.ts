import i18n from '@/i18n';
import { arrayUnion, doc, getDocFromServer, getFirestore, increment, runTransaction } from '@react-native-firebase/firestore';
import { CHALLENGE_DEFS } from '../definitions';
import { applyChallengeOperation, refreshChallengeDay, type ChallengeData, type ChallengeOperation } from './challengeState';

/** Aynı anda açılan cihazlar ve hafta geçişi aynı belge transaction'ıyla korunur. */
export async function persistChallengeOperation(
  userId: string,
  operation: ChallengeOperation | undefined,
  isCurrentSession: () => boolean,
) {
  const db = getFirestore();
  const ref = doc(db, 'users', userId);
  if (!isCurrentSession()) throw new Error(i18n.t('challenges.errors.sessionChanged'));
  // Girişte değişmeyen veriyi yüklemek için native transaction açma.
  // Takvim değişmişse aşağıdaki transaction veriyi yeniden okuyarak yeniler.
  if (!operation) {
    const snapshot = await getDocFromServer(ref);
    if (!isCurrentSession()) throw new Error(i18n.t('challenges.errors.sessionChanged'));
    if (!snapshot.exists()) throw new Error(i18n.t('challenges.errors.profileNotFound'));
    const stored = snapshot.data() as Partial<ChallengeData>;
    const next = refreshChallengeDay(stored);
    if (!Object.keys(challengeUpdates(stored, next)).length) return { data: next, completed: false };
  }
  return runTransaction(db, async transaction => {
    if (!isCurrentSession()) throw new Error(i18n.t('challenges.errors.sessionChanged'));
    const snapshot = await transaction.get(ref);
    if (!isCurrentSession()) throw new Error(i18n.t('challenges.errors.sessionChanged'));
    if (!snapshot.exists()) throw new Error(i18n.t('challenges.errors.profileNotFound'));
    const stored = snapshot.data() as Partial<ChallengeData>;
    const refreshed = refreshChallengeDay(stored);
    const next = operation ? applyChallengeOperation(refreshed, operation) : refreshed;
    const updates = challengeUpdates(stored, next);
    if (Object.keys(updates).length) transaction.update(ref, updates);
    const completed = operation?.kind === 'track' && CHALLENGE_DEFS.some(def =>
      def.tracker === operation.tracker && (refreshed.challengeProgress[def.id] ?? 0) < def.goal
        && (next.challengeProgress[def.id] ?? 0) >= def.goal);
    return { data: next, completed };
  });
}

function challengeUpdates(stored: Partial<ChallengeData>, next: ChallengeData) {
  const updates: Record<string, unknown> = {};
  if (stored.lastActiveDate !== next.lastActiveDate) updates.lastActiveDate = next.lastActiveDate;
  if (stored.challengeWeekStart !== next.challengeWeekStart) updates.challengeWeekStart = next.challengeWeekStart;
  if ((stored.streak ?? 0) !== next.streak) updates.streak = increment(next.streak - (stored.streak ?? 0));
  for (const [id, value] of Object.entries(next.challengeProgress)) {
    const previous = stored.challengeProgress?.[id] ?? 0;
    if (value !== previous) updates[`challengeProgress.${id}`] = increment(value - previous);
  }
  if (next.xp !== (stored.xp ?? 0)) updates.xp = increment(next.xp - (stored.xp ?? 0));
  const claimed = next.claimedChallenges.filter(id => !stored.claimedChallenges?.includes(id));
  if (claimed.length) updates.claimedChallenges = arrayUnion(...claimed);
  return updates;
}
