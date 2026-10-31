import {
  CHALLENGE_DEFS, getRankIndex, MAX_CLAIM_XP, ONCE_CLAIM_IDS, RANKS, WEEKLY_CLAIM_IDS, type Tracker,
} from '@/features/challenges/definitions';
import { todayKey, weekendStatus, weekStartKey, yesterdayKey } from '@/features/challenges/services/challengeCalendar';
import {
  applyChallengeOperation, emptyChallengeData, isClaimed, isTrackNoop, refreshChallengeDay, weekendProgress,
  type ChallengeData,
} from '@/features/challenges/services/challengeState';

describe('getRankIndex', () => {
  it('sıfır XP ilk rütbede kalır', () => {
    expect(getRankIndex(0)).toBe(0);
  });

  it('eşiğin tam üstündeki XP bir sonraki rütbeye geçirir', () => {
    expect(getRankIndex(RANKS[1].min)).toBe(1);
    expect(getRankIndex(RANKS[1].min - 1)).toBe(0);
  });

  it('en yüksek eşiğin üstünde son rütbede sabitlenir', () => {
    expect(getRankIndex(999_999)).toBe(RANKS.length - 1);
  });
});

describe('görev tanımları', () => {
  it('kimlikler tekildir', () => {
    const ids = CHALLENGE_DEFS.map(def => def.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('her görevin ulaşılabilir bir hedefi ve ödülü vardır', () => {
    CHALLENGE_DEFS.forEach(def => {
      expect(def.goal).toBeGreaterThan(0);
      expect(def.xp).toBeGreaterThan(0);
    });
  });
});

// Anahtarlar YEREL takvim günüdür; testler de yerel olarak çözümlemeli.
const asLocalDate = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

describe('görev takvimi', () => {
  it('anahtarlar YYYY-AA-GG biçimindedir', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('dün, bugünden bir gün öncedir', () => {
    const diff = asLocalDate(todayKey()).getTime() - asLocalDate(yesterdayKey()).getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });

  it('bugünün anahtarı yerel takvim gününü verir (UTC kaymasına düşmez)', () => {
    const now = new Date();
    expect(asLocalDate(todayKey()).getDate()).toBe(now.getDate());
  });

  it('hafta başı pazartesidir ve bugünden sonra olamaz', () => {
    expect(asLocalDate(weekStartKey()).getDay()).toBe(1);
    expect(weekStartKey() <= todayKey()).toBe(true);
  });
});

describe('görev kuralları ile tanımların eşleşmesi', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- düz metin okuma; jest depo kökünde çalışır
  const rules: string = require('fs').readFileSync('firestore.rules', 'utf8');
  const listOf = (name: string) => JSON.parse(
    (rules.match(new RegExp(`function ${name}\\(\\) \\{ return (\\[[^\\]]*\\]); \\}`))?.[1] ?? '[]').replace(/'/g, '"'),
  );

  it('kalıcı ve haftalık ödül kimlikleri kuraldakiyle aynıdır', () => {
    expect(listOf('onceClaimIds').sort()).toEqual([...ONCE_CLAIM_IDS].sort());
    expect(listOf('weeklyClaimIds').sort()).toEqual([...WEEKLY_CLAIM_IDS].sort());
  });

  it('kuraldaki XP üst sınırı tek ödülün en yüksek değeridir', () => {
    expect(Number(rules.match(/function maxClaimXp\(\) \{ return (\d+); \}/)?.[1])).toBe(MAX_CLAIM_XP);
  });
});

describe('hafta sonu penceresi', () => {
  const on = (day: number) => weekendStatus(new Date(2026, 9, 26 + day - 1, 12));
  it('Cuma–Pazar aktiftir ve kalan günü bugün dahil sayar', () => {
    expect(on(5)).toEqual({ active: true, days: 3 });
    expect(on(6)).toEqual({ active: true, days: 2 });
    expect(on(7)).toEqual({ active: true, days: 1 });
  });
  it('hafta içi Cuma\'ya kalan günü verir', () => {
    expect(on(1)).toEqual({ active: false, days: 4 });
    expect(on(4)).toEqual({ active: false, days: 1 });
  });
});

describe('görev durumu', () => {
  const track = (data: ChallengeData, tracker: Tracker, key: string, weekend = false) =>
    applyChallengeOperation(data, { kind: 'track', tracker, key, weekend });
  const claim = (data: ChallengeData, challengeId: string) =>
    applyChallengeOperation(data, { kind: 'claim', challengeId });

  it('aynı anahtar bir kez sayılır: tekrar okuma ve aynı hikâyeye ikinci yorum ilerletmez', () => {
    let data = track(emptyChallengeData, 'chaptersRead', 's:0');
    data = track(data, 'chaptersRead', 's:0');
    data = track(data, 'chaptersRead', 's:1');
    expect(data.challengeProgress).toMatchObject({ r1: 2, r3: 2 });
    data = track(track(data, 'commentsPosted', 's'), 'commentsPosted', 's');
    expect(data.challengeProgress.c1).toBe(1);
    expect(isTrackNoop(data, 'commentsPosted', 's', false)).toBe(true);
    expect(isTrackNoop(data, 'commentsPosted', 'other', false)).toBe(false);
  });

  it('anahtar listesi hedefte durur', () => {
    let data = emptyChallengeData;
    for (let index = 0; index < 8; index += 1) data = track(data, 'newFollows', `u${index}`);
    expect(data.challengeProgress.c2).toBe(3);
    expect(data.challengeKeys.c2).toHaveLength(3);
  });

  it('hafta sonu parçaları yalnızca pencerede ilerler; ödül iki parça da dolunca alınır', () => {
    let data = track(emptyChallengeData, 'chaptersRead', 'x:0');
    expect(weekendProgress(data)).toBe(0);
    for (const key of ['a:0', 'a:1', 'a:2']) data = track(data, 'chaptersRead', key, true);
    data = track(data, 'commentsPosted', 'a', true);
    expect(weekendProgress(data)).toBe(4);
    expect(claim(data, 'wk')).toBe(data);
    data = claim(track(data, 'commentsPosted', 'b', true), 'wk');
    expect(data).toMatchObject({ xp: 250, weeklyClaims: ['wk'] });
    expect(claim(data, 'wk').xp).toBe(250);
  });

  it('haftalık ödül haftalık listeye, rozetli ödül kalıcı listeye yazılır', () => {
    const data = { ...emptyChallengeData, challengeProgress: { c1: 5, c4: 1 } };
    expect(claim(data, 'c1')).toMatchObject({ xp: 90, weeklyClaims: ['c1'], claimedChallenges: [] });
    expect(claim(data, 'c4')).toMatchObject({ xp: 180, weeklyClaims: [], claimedChallenges: ['c4'] });
    // Eski sürümün kalıcı listeye yazdığı haftalık talep bu haftayı kilitlemez.
    expect(isClaimed({ ...data, claimedChallenges: ['c1'] }, 'c1')).toBe(false);
  });

  it('yeni haftada haftalık ödüller ve anahtarlar sıfırlanır, kalıcılar korunur', () => {
    const next = refreshChallengeDay({
      challengeWeekStart: '2020-01-06', lastActiveDate: '2020-01-07',
      challengeProgress: { c1: 5, w3: 1 }, challengeKeys: { c1: ['s'], w3: ['t'] },
      weeklyClaims: ['c1'], claimedChallenges: ['w3'],
    });
    expect(next).toMatchObject({
      challengeProgress: { c1: 0, w3: 1 }, challengeKeys: { c1: [], w3: ['t'] },
      weeklyClaims: [], claimedChallenges: ['w3'], streak: 1,
    });
  });

  it('daha önce yayın yapmış yazar "ilk hikâyeni yayınla" ödülünü alabilir', () => {
    expect(refreshChallengeDay({ storiesCount: 4 }).challengeProgress.w4).toBe(1);
    expect(refreshChallengeDay({}).challengeProgress.w4).toBeUndefined();
  });

  it('takvim geri gitmez (saat dilimi değişimi kural reddine düşmesin)', () => {
    const future = '2999-01-01';
    const next = refreshChallengeDay({ lastActiveDate: future, streak: 7 });
    expect(next).toMatchObject({ lastActiveDate: future, streak: 7 });
  });
});
