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

export const RANKS = [
  { name: 'challenges.ranks.newPen', min: 0, icon: 'pencil-outline' },
  { name: 'challenges.ranks.reader', min: 500, icon: 'book-outline' },
  { name: 'challenges.ranks.commenter', min: 1200, icon: 'chatbubbles-outline' },
  { name: 'challenges.ranks.narrator', min: 2500, icon: 'create-outline' },
  { name: 'challenges.ranks.storyteller', min: 3500, icon: 'library-outline' },
  { name: 'challenges.ranks.novelist', min: 5200, icon: 'bookmarks-outline' },
  { name: 'challenges.ranks.masterPen', min: 8000, icon: 'trophy-outline' },
];

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
  write: '#DE5B88',
  read: '#7057D9',
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

/** XP'nin karşılık geldiği rütbe sırası. */
export const getRankIndex = (xp: number): number =>
  RANKS.reduce((best, rank, index) => (xp >= rank.min ? index : best), 0);
