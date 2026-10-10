import { CHALLENGE_DEFS, getRankIndex, RANKS } from '@/features/challenges/definitions';
import { todayKey, weekStartKey, yesterdayKey } from '@/features/challenges/services/challengeCalendar';

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
