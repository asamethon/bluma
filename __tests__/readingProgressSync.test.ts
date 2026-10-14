import { decideSync, SYNC_INTERVAL_MS } from '@/features/story/services/readingProgress/syncPolicy';

describe('decideSync', () => {
  it('ilk kayıt hemen yazılır', () => {
    expect(decideSync(undefined, 0, 1_000)).toEqual({ writeNow: true, delayMs: 0, chapterChanged: true });
  });

  it('bölüm değişince aralık beklenmeden yazılır', () => {
    const decision = decideSync({ chapterIndex: 1, at: 1_000 }, 2, 2_000);
    expect(decision.writeNow).toBe(true);
    expect(decision.chapterChanged).toBe(true);
  });

  it('aynı bölümde kaydırma aralık dolana kadar ertelenir', () => {
    const decision = decideSync({ chapterIndex: 1, at: 10_000 }, 1, 25_000);
    expect(decision).toEqual({ writeNow: false, delayMs: SYNC_INTERVAL_MS - 15_000, chapterChanged: false });
  });

  it('aralık dolunca aynı bölümde de yazılır', () => {
    expect(decideSync({ chapterIndex: 1, at: 0 }, 1, SYNC_INTERVAL_MS).writeNow).toBe(true);
  });

  it('10 dakikalık kesintisiz okuma en fazla ~10 yazım üretir (eskiden ~300)', () => {
    const state = { last: undefined as { chapterIndex: number; at: number } | undefined, writes: 0 };
    for (let now = 0; now <= 10 * 60 * 1000; now += 2_000) {
      if (decideSync(state.last, 0, now).writeNow) {
        state.writes += 1;
        state.last = { chapterIndex: 0, at: now };
      }
    }
    expect(state.writes).toBeLessThanOrEqual(11);
  });
});
