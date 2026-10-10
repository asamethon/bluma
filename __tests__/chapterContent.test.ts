import { joinChapters, splitChapters } from '@/features/story/utils/chapterContent';

const chapter = (id: string, title: string, content: string) => ({ id, title, content });

describe('splitChapters', () => {
  it('ayraçsız tek bölümlü metni olduğu gibi döndürür', () => {
    const result = splitChapters('Tek parça metin', ['Başlangıç']);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Tek parça metin');
    expect(result[0].title).toBe('Başlangıç');
  });

  it('§§ ayracıyla bölümlere ayırır', () => {
    const result = splitChapters('Birinci\n§§\nİkinci', ['Bir', 'İki']);
    expect(result.map(item => item.content)).toEqual(['Birinci', 'İkinci']);
    expect(result.map(item => item.title)).toEqual(['Bir', 'İki']);
  });

  it('başlık varken ayraç yoksa paragrafları bölümlere dağıtır', () => {
    const result = splitChapters('A\n\nB\n\nC\n\nD', ['Bir', 'İki']);
    expect(result).toHaveLength(2);
    expect(result.every(item => item.content.length > 0)).toBe(true);
  });

  it('boş içerikte de en az bir bölüm üretir', () => {
    expect(splitChapters('', [])).toHaveLength(1);
  });
});

describe('joinChapters', () => {
  it('bölümleri ayraçla birleştirir', () => {
    const joined = joinChapters([chapter('1', 'Bir', 'A'), chapter('2', 'İki', 'B')]);
    expect(joined).toContain('§§');
  });

  it('böl → birleştir → böl döngüsü içeriği korur', () => {
    const original = 'Birinci bölüm\n§§\nİkinci bölüm';
    const roundTrip = joinChapters(splitChapters(original, ['Bir', 'İki']));
    expect(splitChapters(roundTrip, ['Bir', 'İki']).map(c => c.content.trim()))
      .toEqual(['Birinci bölüm', 'İkinci bölüm']);
  });
});
