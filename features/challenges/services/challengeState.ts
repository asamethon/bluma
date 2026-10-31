import {
  CHALLENGE_DEFS, ONCE_CLAIM_IDS, WEEKEND_CHALLENGE, WEEKEND_GOAL, type Tracker,
} from '../definitions';
import { todayKey, weekStartKey, yesterdayKey } from './challengeCalendar';

export interface ChallengeData {
  xp: number;
  streak: number;
  lastActiveDate: string;
  challengeWeekStart: string;
  challengeProgress: Record<string, number>;
  /** Görev başına sayılmış anahtarlar; aynı anahtar ikinci kez sayılmaz. */
  challengeKeys: Record<string, string[]>;
  /** Kalıcı ödüller. Eski sürümlerin haftalık talepleri de burada kalabilir. */
  claimedChallenges: string[];
  /** Bu haftanın ödülleri — pazartesi sıfırlanır. */
  weeklyClaims: string[];
}
export type ChallengeOperation =
  /** `weekend`: aksiyon kuyruğa girdiği an Cuma–Pazar penceresinde miydi. */
  | { kind: 'track'; tracker: Tracker; key: string; weekend: boolean }
  | { kind: 'claim'; challengeId: string };

export const emptyChallengeData: ChallengeData = {
  xp: 0, streak: 0, lastActiveDate: '', challengeWeekStart: '',
  challengeProgress: {}, challengeKeys: {}, claimedChallenges: [], weeklyClaims: [],
};

type Target = { id: string; goal: number; tracker: Tracker };
const weeklyTargets: Target[] = [
  ...CHALLENGE_DEFS.filter(def => def.repeat === 'weekly'),
  ...WEEKEND_CHALLENGE.parts,
];

/** Sunucudaki kullanıcı belgesinden yalnızca görev alanlarını alır. */
function normalize(stored: Partial<ChallengeData>): ChallengeData {
  return {
    xp: stored.xp ?? 0,
    streak: stored.streak ?? 0,
    lastActiveDate: stored.lastActiveDate ?? '',
    challengeWeekStart: stored.challengeWeekStart ?? '',
    challengeProgress: { ...stored.challengeProgress },
    challengeKeys: { ...stored.challengeKeys },
    claimedChallenges: [...(stored.claimedChallenges ?? [])],
    weeklyClaims: [...(stored.weeklyClaims ?? [])],
  };
}

/**
 * Takvim yenilemesi sunucudan okunan belge üzerinde uygulanır. Tarihler
 * GERİ GİTMEZ: saat dilimi değişiminde ya da saati ileride başka bir
 * cihazdan sonra "dün"e dönen yazım kural tarafından reddedilir ve tüm
 * görev yazımlarını kilitlerdi.
 */
export function refreshChallengeDay(stored: Partial<ChallengeData> & { storiesCount?: number }): ChallengeData {
  const data = normalize(stored);
  const today = todayKey();
  const yesterday = yesterdayKey();
  const streak = !data.lastActiveDate || data.lastActiveDate < yesterday ? 1
    : data.lastActiveDate === yesterday ? data.streak + 1 : data.streak || 1;
  const newWeek = data.challengeWeekStart < weekStartKey();
  const progress = { ...data.challengeProgress };
  const keys = { ...data.challengeKeys };
  if (newWeek) {
    for (const target of weeklyTargets) {
      if (progress[target.id]) progress[target.id] = 0;
      if (keys[target.id]?.length) keys[target.id] = [];
    }
  }
  // "İlk hikâyeni yayınla": daha önce yayın yapmış yazar da ödülünü alır.
  const published = stored.storiesCount ?? 0;
  for (const def of CHALLENGE_DEFS) {
    if (def.repeat === 'once' && def.tracker === 'storiesPublished' && published > 0) {
      progress[def.id] = Math.max(progress[def.id] ?? 0, Math.min(published, def.goal));
    }
  }
  return {
    ...data,
    streak,
    lastActiveDate: data.lastActiveDate > today ? data.lastActiveDate : today,
    challengeWeekStart: newWeek ? weekStartKey() : data.challengeWeekStart,
    challengeProgress: progress,
    challengeKeys: keys,
    weeklyClaims: newWeek ? [] : data.weeklyClaims,
  };
}

/** Aksiyonun ilerleteceği görevler (hafta sonu parçaları yalnızca pencerede). */
function trackTargets(tracker: Tracker, weekend: boolean): Target[] {
  return [
    ...CHALLENGE_DEFS.filter(def => def.tracker === tracker),
    ...(weekend ? WEEKEND_CHALLENGE.parts.filter(part => part.tracker === tracker) : []),
  ];
}

/** Anahtar bu görevde henüz sayılmadıysa ve hedef dolmadıysa sayılır. */
function counts(data: ChallengeData, target: Target, key: string) {
  return (data.challengeProgress[target.id] ?? 0) < target.goal
    && !(data.challengeKeys[target.id] ?? []).includes(key);
}

export function isTrackNoop(data: ChallengeData, tracker: Tracker, key: string, weekend: boolean) {
  return !trackTargets(tracker, weekend).some(target => counts(data, target, key));
}

export function isClaimed(data: ChallengeData, challengeId: string) {
  return ONCE_CLAIM_IDS.includes(challengeId)
    ? data.claimedChallenges.includes(challengeId)
    : data.weeklyClaims.includes(challengeId);
}

export function weekendProgress(data: ChallengeData) {
  return WEEKEND_CHALLENGE.parts.reduce((total, part) =>
    total + Math.min(data.challengeProgress[part.id] ?? 0, part.goal), 0);
}

function claimReward(data: ChallengeData, challengeId: string): number | null {
  if (isClaimed(data, challengeId)) return null;
  if (challengeId === WEEKEND_CHALLENGE.id) {
    return weekendProgress(data) >= WEEKEND_GOAL ? WEEKEND_CHALLENGE.xp : null;
  }
  const def = CHALLENGE_DEFS.find(item => item.id === challengeId);
  return def && (data.challengeProgress[def.id] ?? 0) >= def.goal ? def.xp : null;
}

export function applyChallengeOperation(data: ChallengeData, operation: ChallengeOperation): ChallengeData {
  if (operation.kind === 'claim') {
    const reward = claimReward(data, operation.challengeId);
    if (reward === null) return data;
    const once = ONCE_CLAIM_IDS.includes(operation.challengeId);
    return {
      ...data,
      xp: data.xp + reward,
      claimedChallenges: once ? [...data.claimedChallenges, operation.challengeId] : data.claimedChallenges,
      weeklyClaims: once ? data.weeklyClaims : [...data.weeklyClaims, operation.challengeId],
    };
  }
  const progress = { ...data.challengeProgress };
  const keys = { ...data.challengeKeys };
  for (const target of trackTargets(operation.tracker, operation.weekend)) {
    if (!counts(data, target, operation.key)) continue;
    progress[target.id] = (progress[target.id] ?? 0) + 1;
    keys[target.id] = [...(keys[target.id] ?? []), operation.key];
  }
  return { ...data, challengeProgress: progress, challengeKeys: keys };
}
