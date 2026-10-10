import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { store } from '@/store';
import { patchChallenge, setChallengeState } from '@/store/slices/challengeSlice';
import { logger } from '@/utils/logger';
import { arrayUnion, doc, getDoc, getFirestore, updateDoc } from '@react-native-firebase/firestore';
import { CHALLENGE_DEFS, type Tracker } from '../definitions';
import { todayKey, weekStartKey, yesterdayKey } from './challengeCalendar';

/** Her hafta başında sıfırlanan sayaçlar. */
const WEEKLY_TRACKERS: Tracker[] = ['storiesPublished', 'chaptersRead', 'commentsPosted', 'newFollows'];

type StoredProgress = {
  xp?: number;
  streak?: number;
  lastActiveDate?: string;
  challengeWeekStart?: string;
  challengeProgress?: Record<string, number>;
  claimedChallenges?: string[];
};

const userRef = (userId: string) => doc(getFirestore(), 'users', userId);

/** Dün aktifse seri uzar, ara verildiyse baştan başlar. */
function nextStreak(data: StoredProgress): number {
  const yesterday = yesterdayKey();
  if (!data.lastActiveDate || data.lastActiveDate < yesterday) return 1;
  if (data.lastActiveDate === yesterday) return (data.streak ?? 0) + 1;
  return data.streak || 1;
}

function refreshedProgress(stored: Record<string, number>, streak: number, isNewWeek: boolean) {
  const weeklyReset = isNewWeek
    ? CHALLENGE_DEFS.filter(def => WEEKLY_TRACKERS.includes(def.tracker)).map(def => [def.id, 0])
    : [];
  const streakProgress = CHALLENGE_DEFS.filter(def => def.tracker === 'streakDays').map(def => [
    def.id,
    Math.min(streak, def.goal),
  ]);
  return { ...stored, ...Object.fromEntries([...weeklyReset, ...streakProgress]) };
}

async function loadProgress(userId: string) {
  try {
    const snapshot = await getDoc(userRef(userId));
    if (!snapshot.exists()) return;

    const data = (snapshot.data() ?? {}) as StoredProgress;
    const today = todayKey();
    const weekStart = weekStartKey();
    const isNewWeek = (data.challengeWeekStart || '') < weekStart;
    const streak = nextStreak(data);
    const challengeProgress = refreshedProgress(data.challengeProgress ?? {}, streak, isNewWeek);

    store.dispatch(setChallengeState({
      xp: data.xp ?? 0,
      streak,
      challengeProgress,
      claimedChallenges: data.claimedChallenges ?? [],
      isLoaded: true,
    }));

    if (data.lastActiveDate !== today || isNewWeek) {
      await updateDoc(userRef(userId), {
        streak,
        lastActiveDate: today,
        challengeWeekStart: weekStart,
        challengeProgress,
      });
    }
  } catch (error) {
    logger.error('challengeStore loadProgress hatası:', error);
  }
}

async function claimChallenge(userId: string, challengeId: string) {
  const def = CHALLENGE_DEFS.find(challenge => challenge.id === challengeId);
  const { xp, claimedChallenges } = store.getState().challenge;
  if (!def || claimedChallenges.includes(challengeId)) return;

  store.dispatch(patchChallenge({
    xp: xp + def.xp,
    claimedChallenges: [...claimedChallenges, challengeId],
  }));

  try {
    await updateDoc(userRef(userId), { xp: xp + def.xp, claimedChallenges: arrayUnion(challengeId) });
  } catch (error) {
    logger.error('challengeStore claimChallenge hatası:', error);
  }
}

async function trackAction(userId: string, tracker: Tracker, amount = 1) {
  const current = store.getState().challenge.challengeProgress;
  const advanced = CHALLENGE_DEFS.filter(def => def.tracker === tracker).map(def => {
    const before = current[def.id] ?? 0;
    return { def, before, after: Math.min(before + amount, def.goal) };
  });
  if (advanced.length === 0) return;

  const challengeProgress = {
    ...current,
    ...Object.fromEntries(advanced.map(({ def, after }) => [def.id, after])),
  };
  store.dispatch(patchChallenge({ challengeProgress }));

  // Görevi bitirmek de bir "mutlu an": değerlendirme eşiğine sayılır.
  if (advanced.some(({ def, before, after }) => before < def.goal && after >= def.goal)) {
    reviewPromptActions.recordMoment('challengeCompleted').catch(() => {});
  }

  try {
    await updateDoc(userRef(userId), { challengeProgress });
  } catch (error) {
    logger.error('challengeStore trackAction hatası:', error);
  }
}

export const challengeActions = { loadProgress, claimChallenge, trackAction };
