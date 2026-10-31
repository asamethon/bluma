import { CHALLENGE_DEFS, getRankIndex, RANKS, WEEKLY_FEATURED } from '@/features/challenges/definitions';
import { todayKey, weekStartKey, yesterdayKey } from '@/features/challenges/services/challengeCalendar';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- kural dosyasını okuyan yardımcı CJS olarak çalışır.
const { allowedChallengeRewards } = require('../scripts/challengeRewards.cjs');

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

// XP istemciden yazıldığı için firestore.rules yalnızca TANIMLI ödül
// miktarlarını kabul ediyor. Liste elle eşlendiğinden yeni bir ödül eklenince
// bu test kırılır: kuralı güncellemeden ödül alma izin hatası vermesin.
describe('kural ile ödül miktarı eşlemesi', () => {
  const allowed: number[] = allowedChallengeRewards();

  it('firestore.rules ödül listesini okuyabiliyor', () => {
    expect(allowed.length).toBeGreaterThan(0);
    expect(allowed.every(Number.isInteger)).toBe(true);
  });

  it('her görev ödülü kuralda tanımlı', () => {
    for (const def of CHALLENGE_DEFS) {
      expect(allowed).toContain(def.xp);
    }
  });

  it('hafta sonu ödülü kuralda tanımlı', () => {
    expect(allowed).toContain(WEEKLY_FEATURED.xp);
  });
});
