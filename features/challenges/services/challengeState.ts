import { CHALLENGE_DEFS, type Tracker } from '../definitions';
import { todayKey, weekStartKey, yesterdayKey } from './challengeCalendar';

export interface ChallengeData {
  xp: number;
  streak: number;
  lastActiveDate: string;
  challengeWeekStart: string;
  challengeProgress: Record<string, number>;
  claimedChallenges: string[];
}
export type ChallengeOperation =
  | { kind: 'track'; tracker: Tracker; amount: number }
  | { kind: 'claim'; challengeId: string };

export const emptyChallengeData: ChallengeData = {
  xp: 0, streak: 0, lastActiveDate: '', challengeWeekStart: '',
  challengeProgress: {}, claimedChallenges: [],
};
const weeklyTrackers: Tracker[] = ['storiesPublished', 'chaptersRead', 'commentsPosted', 'newFollows', 'storyLikes', 'authorsDiscovered', 'storiesCompletedByAuthor'];

/** Takvim yenilemesi sunucudan okunan ilerleme üzerinde uygulanır. */
export function refreshChallengeDay(stored: Partial<ChallengeData>): ChallengeData {
  const data = { ...emptyChallengeData, ...stored };
  const yesterday = yesterdayKey();
  const streak = !data.lastActiveDate || data.lastActiveDate < yesterday ? 1
    : data.lastActiveDate === yesterday ? data.streak + 1 : data.streak || 1;
  const progress = { ...data.challengeProgress };
  const weekChanged = data.challengeWeekStart < weekStartKey();
  let claimedChallenges = data.claimedChallenges || [];
  for (const def of CHALLENGE_DEFS) {
    if (weekChanged && weeklyTrackers.includes(def.tracker)) {
      progress[def.id] = 0;
      claimedChallenges = claimedChallenges.filter(id => id !== def.id);
    }
    if (def.tracker === 'streakDays') progress[def.id] = Math.min(streak, def.goal);
  }
  return { ...data, streak, lastActiveDate: todayKey(), challengeWeekStart: weekStartKey(), challengeProgress: progress, claimedChallenges };
}

export function applyChallengeOperation(data: ChallengeData, operation: ChallengeOperation): ChallengeData {
  if (operation.kind === 'claim') {
    const def = CHALLENGE_DEFS.find(item => item.id === operation.challengeId);
    if (!def || data.claimedChallenges.includes(def.id) || (data.challengeProgress[def.id] ?? 0) < def.goal) return data;
    return { ...data, xp: data.xp + def.xp, claimedChallenges: [...data.claimedChallenges, def.id] };
  }
  const progress = { ...data.challengeProgress };
  for (const def of CHALLENGE_DEFS.filter(item => item.tracker === operation.tracker)) {
    progress[def.id] = Math.min((progress[def.id] ?? 0) + operation.amount, def.goal);
  }
  return { ...data, challengeProgress: progress };
}
