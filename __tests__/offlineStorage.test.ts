import { MAX_STORAGE_KB, measureStory } from '@/features/story/services/offline/storage';
import type { Story } from '@/types';

const story = (overrides: Partial<Story> = {}) =>
  ({ id: 's1', title: '', description: '', content: '', ...overrides }) as Story;

describe('measureStory', () => {
  it('boş hikâye yalnızca üstveri payı kadar yer kaplar', () => {
    expect(measureStory(story())).toBe(1);
  });

  it('içerik uzadıkça boyut artar', () => {
    const short = measureStory(story({ content: 'a'.repeat(1000) }));
    const long = measureStory(story({ content: 'a'.repeat(100_000) }));
    expect(long).toBeGreaterThan(short);
  });

  it('bölüm listesi verildiğinde hikâye gövdesi yerine bölümleri ölçer', () => {
    const withChapters = measureStory(story({ content: 'x' }), [
      { content: 'a'.repeat(5000) },
      { content: 'b'.repeat(5000) },
    ]);
    const withoutChapters = measureStory(story({ content: 'x' }));
    expect(withChapters).toBeGreaterThan(withoutChapters);
  });

  it('başlık ve açıklama da hesaba katılır', () => {
    const bare = measureStory(story());
    const titled = measureStory(story({ title: 't'.repeat(2000), description: 'd'.repeat(2000) }));
    expect(titled).toBeGreaterThan(bare);
  });

  it('makul bir hikâye kotayı tek başına doldurmaz', () => {
    expect(measureStory(story({ content: 'a'.repeat(200_000) }))).toBeLessThan(MAX_STORAGE_KB);
  });
});
