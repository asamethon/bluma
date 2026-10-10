import { readSource, rememberSource, resetSources } from '@/features/discovery/services/feedAttribution';

describe('feedAttribution', () => {
  beforeEach(resetSources);

  it('vitrinden açılan hikâyenin kaynağını hatırlar', () => {
    rememberSource('s1', 'for_you', 1_000);
    expect(readSource('s1', 1_000 + 60_000)).toBe('for_you');
  });

  it('30 dakikadan eski kaynak doğrudan okuma sayılır', () => {
    rememberSource('s1', 'popular_now', 0);
    expect(readSource('s1', 31 * 60 * 1000)).toBe('direct');
  });

  it('hiç vitrinden açılmamış hikâye doğrudan okuma sayılır', () => {
    expect(readSource('bilinmeyen')).toBe('direct');
  });

  it('aynı hikâye yeniden açılınca son kaynak geçerli olur', () => {
    rememberSource('s1', 'search', 0);
    rememberSource('s1', 'following', 10);
    expect(readSource('s1', 20)).toBe('following');
  });
});
