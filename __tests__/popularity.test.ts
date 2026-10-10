import { calculatePopularityScore } from '@/features/story/services/discover/popularity';
import type { Story } from '@/types';

const story = (overrides: Partial<Story> = {}) =>
  ({ id: 's', likesCount: 0, commentsCount: 0, viewsCount: 0, ...overrides }) as Story;

describe('calculatePopularityScore', () => {
  it('etkileşimi olmayan hikâye en düşük puanı alır', () => {
    expect(calculatePopularityScore(story())).toBeLessThanOrEqual(
      calculatePopularityScore(story({ likesCount: 1 })),
    );
  });

  it('beğeni görüntülemeden daha ağır basar', () => {
    const liked = calculatePopularityScore(story({ likesCount: 10 }));
    const viewed = calculatePopularityScore(story({ viewsCount: 10 }));
    expect(liked).toBeGreaterThan(viewed);
  });

  it('yorum beğeniden daha ağır basar', () => {
    const commented = calculatePopularityScore(story({ commentsCount: 10 }));
    const liked = calculatePopularityScore(story({ likesCount: 10 }));
    expect(commented).toBeGreaterThan(liked);
  });

  it('eksik sayaçlarda çökmez', () => {
    expect(Number.isFinite(calculatePopularityScore({ id: 'x' } as Story))).toBe(true);
  });
});
