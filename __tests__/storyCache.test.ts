import { cachedStory, forgetStory, rememberStory } from '@/features/story/services/storyCache';
import type { Story } from '@/types';

const story = (id: string) => ({ id, title: id }) as Story;

describe('storyCache', () => {
  beforeEach(() => forgetStory());

  it('10 dakika içinde aynı hikâyeyi döner', () => {
    rememberStory(story('a'), 0);
    expect(cachedStory('a', 9 * 60 * 1000)?.title).toBe('a');
  });

  it('süresi dolan kaydı vermez', () => {
    rememberStory(story('a'), 0);
    expect(cachedStory('a', 11 * 60 * 1000)).toBeNull();
  });

  it('düzenlenen hikâye unutulur', () => {
    rememberStory(story('a'), 0);
    forgetStory('a');
    expect(cachedStory('a', 1)).toBeNull();
  });
});
