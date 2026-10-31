import {
  addTag, MAX_TAGS, normalizeLanguage, normalizeTag, normalizeWarnings, sameLanguage,
} from '@/features/story/utils/storyDetails';

describe('hikâye dili', () => {
  it('eski düzenleme ekranının etiketlerini koda indirir', () => {
    expect(['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'İtalyanca', 'Rusça', 'Japonca', 'Korece', 'Çince']
      .map(normalizeLanguage)).toEqual(['tr', 'en', 'de', 'fr', 'es', 'it', 'ru', 'ja', 'ko', 'zh']);
  });
  it('bölgesel ve büyük harfli kodları temel koda indirir', () => {
    expect(normalizeLanguage('pt-BR')).toBe('pt');
    expect(normalizeLanguage('TR')).toBe('tr');
    expect(normalizeLanguage('zh_Hans')).toBe('zh');
    expect(normalizeLanguage('')).toBeUndefined();
    expect(normalizeLanguage('Klingonca')).toBeUndefined();
  });
  it('eski "Türkçe" hikâye Türk okurla eşleşir', () => {
    expect(sameLanguage('Türkçe', 'tr')).toBe(true);
    expect(sameLanguage('Türkçe', 'en')).toBe(false);
    expect(sameLanguage(undefined, 'tr')).toBe(false);
  });
});

describe('etiketler', () => {
  it('baştaki #, fazla boşluk ve büyük harf ayıklanır', () => {
    expect(normalizeTag('  #Karanlık   Fantastik ')).toBe('karanlık fantastik');
  });
  it('boş, yinelenen ve sınırı aşan ekleme yok sayılır', () => {
    let tags: string[] = [];
    for (const raw of ['büyü', '#Büyü', '   ', 'ejderha', 'aşk', 'gizem', 'savaş', 'fazla']) tags = addTag(tags, raw);
    expect(tags).toEqual(['büyü', 'ejderha', 'aşk', 'gizem', 'savaş']);
    expect(tags).toHaveLength(MAX_TAGS);
  });
});

describe('içerik uyarıları', () => {
  it('kodları ve eski Türkçe etiketleri tekil, sıralı koda indirir', () => {
    expect(normalizeWarnings(['Şiddet', 'violence', 'Cinsel İçerik', 'Irkçılık', 'bilinmeyen', 'Hayvan Zararı']))
      .toEqual(['violence', 'sexual', 'racism', 'animalHarm']);
    expect(normalizeWarnings(undefined)).toEqual([]);
  });
});
