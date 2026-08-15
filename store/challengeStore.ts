import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from '@react-native-firebase/firestore';
import { store } from './index';
import { patchChallenge, setChallengeState } from './slices/challengeSlice';
import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { logger } from '@/utils/logger';

export type { ChallengeState } from './slices/challengeSlice';

export const RANKS = [
  { name: 'challenges.ranks.newPen',      min: 0,    icon: 'pencil-outline' },
  { name: 'challenges.ranks.reader',      min: 500,  icon: 'book-outline' },
  { name: 'challenges.ranks.commenter',   min: 1200, icon: 'chatbubbles-outline' },
  { name: 'challenges.ranks.narrator',    min: 2500, icon: 'create-outline' },
  { name: 'challenges.ranks.storyteller', min: 3500, icon: 'library-outline' },
  { name: 'challenges.ranks.novelist',    min: 5200, icon: 'bookmarks-outline' },
  { name: 'challenges.ranks.masterPen',   min: 8000, icon: 'trophy-outline' },
];

export type Pillar = 'write' | 'read' | 'comment';
export type Tracker =
  | 'storiesPublished'
  | 'chaptersRead'
  | 'commentsPosted'
  | 'newFollows'
  | 'streakDays'
  | 'manual';

export interface ChallengeDef {
  id: string;
  pillar: Pillar;
  icon: string;
  title: string;
  desc: string;
  goal: number;
  xp: number;
  tracker: Tracker;
  badge?: string;
}

export const CHALLENGE_DEFS: ChallengeDef[] = [
  { id: 'w1', pillar: 'write',   icon: 'create-outline',              title: 'challenges.defs.w1.title', desc: 'challenges.defs.w1.desc', goal: 3,  xp: 150, tracker: 'storiesPublished' },
  { id: 'w2', pillar: 'write',   icon: 'flame-outline',               title: 'challenges.defs.w2.title', desc: 'challenges.defs.w2.desc', goal: 5,  xp: 200, tracker: 'streakDays' },
  { id: 'w3', pillar: 'write',   icon: 'checkmark-done-outline',      title: 'challenges.defs.w3.title', desc: 'challenges.defs.w3.desc', goal: 1,  xp: 300, tracker: 'manual', badge: 'challenges.defs.w3.badge' },
  { id: 'w4', pillar: 'write',   icon: 'bulb-outline',                title: 'challenges.defs.w4.title', desc: 'challenges.defs.w4.desc', goal: 1,  xp: 100, tracker: 'storiesPublished' },
  { id: 'r1', pillar: 'read',    icon: 'book-outline',                title: 'challenges.defs.r1.title', desc: 'challenges.defs.r1.desc', goal: 5,  xp: 80,  tracker: 'chaptersRead' },
  { id: 'r2', pillar: 'read',    icon: 'checkmark-circle-outline',    title: 'challenges.defs.r2.title', desc: 'challenges.defs.r2.desc', goal: 3,  xp: 150, tracker: 'chaptersRead' },
  { id: 'r3', pillar: 'read',    icon: 'time-outline',                title: 'challenges.defs.r3.title', desc: 'challenges.defs.r3.desc', goal: 10, xp: 120, tracker: 'chaptersRead' },
  { id: 'r4', pillar: 'read',    icon: 'compass-outline',             title: 'challenges.defs.r4.title', desc: 'challenges.defs.r4.desc', goal: 1,  xp: 100, tracker: 'manual' },
  { id: 'c1', pillar: 'comment', icon: 'chatbubble-ellipses-outline', title: 'challenges.defs.c1.title', desc: 'challenges.defs.c1.desc', goal: 5,  xp: 90,  tracker: 'commentsPosted' },
  { id: 'c2', pillar: 'comment', icon: 'person-add-outline',          title: 'challenges.defs.c2.title', desc: 'challenges.defs.c2.desc', goal: 3,  xp: 60,  tracker: 'newFollows' },
  { id: 'c3', pillar: 'comment', icon: 'heart-outline',               title: 'challenges.defs.c3.title', desc: 'challenges.defs.c3.desc', goal: 10, xp: 40,  tracker: 'manual' },
  { id: 'c4', pillar: 'comment', icon: 'ribbon-outline',              title: 'challenges.defs.c4.title', desc: 'challenges.defs.c4.desc', goal: 1,  xp: 180, tracker: 'manual', badge: 'challenges.defs.c4.badge' },
];

export const PILLAR_COLORS: Record<Pillar, string> = {
  write: '#FF5C8A',
  read: '#7C5CD0',
  comment: '#2FA98A',
};

export const WEEKLY_FEATURED = {
  title: 'challenges.weekly.title',
  desc: 'challenges.weekly.desc',
  xp: 250,
  endsIn: 'challenges.weekly.endsIn',
  cur: 0,
  goal: 5,
};

export function getRankIndex(xp: number): number {
  let idx = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) { idx = i; break; }
  }
  return idx;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekStartStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split('T')[0];
}

export const challengeActions = {
  async loadProgress(userId: string) {
    try {
      const userRef = doc(getFirestore(), 'users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists) return;

      const data = userDoc.data() as any;
      const today = getTodayStr();
      const weekStart = getWeekStartStr();
      const isNewWeek = (data.challengeWeekStart || '') < weekStart;

      let newStreak = data.streak || 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (!data.lastActiveDate || data.lastActiveDate < yesterdayStr) {
        newStreak = 1;
      } else if (data.lastActiveDate === yesterdayStr) {
        newStreak = (data.streak || 0) + 1;
      } else {
        newStreak = data.streak || 1;
      }

      let challengeProgress: Record<string, number> = data.challengeProgress || {};

      if (isNewWeek) {
        const weeklyTrackers: Tracker[] = ['storiesPublished', 'chaptersRead', 'commentsPosted', 'newFollows'];
        CHALLENGE_DEFS.forEach(c => {
          if (weeklyTrackers.includes(c.tracker)) {
            challengeProgress[c.id] = 0;
          }
        });
      }

      CHALLENGE_DEFS.filter(c => c.tracker === 'streakDays').forEach(c => {
        challengeProgress[c.id] = Math.min(newStreak, c.goal);
      });

      store.dispatch(setChallengeState({
        xp: data.xp || 0,
        streak: newStreak,
        challengeProgress,
        claimedChallenges: data.claimedChallenges || [],
        isLoaded: true,
      }));

      if (data.lastActiveDate !== today || isNewWeek) {
        await updateDoc(userRef, {
          streak: newStreak,
          lastActiveDate: today,
          challengeWeekStart: weekStart,
          challengeProgress,
        });
      }
    } catch (error) {
      logger.error('challengeStore loadProgress hatası:', error);
    }
  },

  async claimChallenge(userId: string, challengeId: string) {
    const def = CHALLENGE_DEFS.find(c => c.id === challengeId);
    if (!def) return;
    const { xp, claimedChallenges } = store.getState().challenge;
    if (claimedChallenges.includes(challengeId)) return;

    try {
      const newXp = xp + def.xp;
      const newClaimed = [...claimedChallenges, challengeId];

      store.dispatch(patchChallenge({ xp: newXp, claimedChallenges: newClaimed }));

      await updateDoc(doc(getFirestore(), 'users', userId), {
        xp: newXp,
        claimedChallenges: arrayUnion(challengeId),
      });
    } catch (error) {
      logger.error('challengeStore claimChallenge hatası:', error);
    }
  },

  async trackAction(userId: string, tracker: Tracker, amount = 1) {
    try {
      const progress = { ...store.getState().challenge.challengeProgress };
      let justCompleted = false;

      CHALLENGE_DEFS.forEach(c => {
        if (c.tracker === tracker) {
          const before = progress[c.id] || 0;
          const after = Math.min(before + amount, c.goal);
          progress[c.id] = after;
          if (before < c.goal && after >= c.goal) justCompleted = true;
        }
      });

      store.dispatch(patchChallenge({ challengeProgress: progress }));

      // Görevi bitirmek de bir "mutlu an": değerlendirme eşiğine sayılır.
      if (justCompleted) {
        reviewPromptActions.recordMoment('challengeCompleted').catch(() => {});
      }

      await updateDoc(doc(getFirestore(), 'users', userId), {
        challengeProgress: progress,
      });
    } catch (error) {
      logger.error('challengeStore trackAction hatası:', error);
    }
  },
};
