import { activeMentionQuery, extractMentions, insertMention } from '@/features/mentions/utils/mentionQuery';

describe('activeMentionQuery', () => {
  it('tek başına @ boş sorgudur', () => {
    expect(activeMentionQuery('@')).toBe('');
    expect(activeMentionQuery('merhaba @')).toBe('');
  });
  it('yazılmakta olan adı döner', () => {
    expect(activeMentionQuery('selam @ay')).toBe('ay');
    expect(activeMentionQuery('satır\n@ali_9')).toBe('ali_9');
  });
  it('etiket bitince (boşluk) liste kapanır', () => {
    expect(activeMentionQuery('selam @ayse ')).toBeNull();
  });
  it('e-posta gibi kelime içi @ etiket sayılmaz', () => {
    expect(activeMentionQuery('mail@ornek')).toBeNull();
  });
});

describe('insertMention', () => {
  it('yazılan sorguyu seçilen adla değiştirir', () => {
    expect(insertMention('selam @ay', 'ayse')).toBe('selam @ayse ');
    expect(insertMention('@', 'ayse')).toBe('@ayse ');
  });
  it('etiket yoksa metne dokunmaz', () => {
    expect(insertMention('selam', 'ayse')).toBe('selam');
  });
});

describe('extractMentions', () => {
  it('tekil ve küçük harfli adları döner', () => {
    expect(extractMentions('@Ayse ve @ayse, @mehmet_1')).toEqual(['ayse', 'mehmet_1']);
  });
  it('en fazla 10 kişi', () => {
    const text = Array.from({ length: 15 }, (_, i) => `@u${i}`).join(' ');
    expect(extractMentions(text)).toHaveLength(10);
  });
});
