import { suggestUsernames } from '@/features/profile/utils/usernameSuggest';

describe('suggestUsernames', () => {
  it('tam ad, alt çizgili ve ilk kelime adaylarını üretir', () => {
    expect(suggestUsernames('Gökçe Yılmaz')).toEqual(['gokceyilmaz', 'gokce_yilmaz', 'gokce']);
  });

  it('Türkçe harfleri çevirir, emoji ve noktalamayı atar', () => {
    expect(suggestUsernames('Şükrü Çağatay 📚')).toEqual(['sukrucagatay', 'sukru_cagatay', 'sukru']);
    expect(suggestUsernames('Ayşe, Demir!')).toEqual(['aysedemir', 'ayse_demir', 'ayse']);
  });

  it('tek kelimede yalnız bir aday döner (kopyalar elenir)', () => {
    expect(suggestUsernames('Özgür')).toEqual(['ozgur']);
  });

  it('tireli adı kelimelere böler', () => {
    expect(suggestUsernames('Ayşe-Gül Kara')).toEqual(['aysegulkara', 'ayse_gul_kara', 'ayse']);
  });

  it('mevcut kullanıcı adını önermez', () => {
    expect(suggestUsernames('Gökçe Yılmaz', 'gokceyilmaz')).toEqual(['gokce_yilmaz', 'gokce']);
    expect(suggestUsernames('Özgür', 'ozgur')).toEqual([]);
  });

  it('3 karakterden kısa adayı eler', () => {
    expect(suggestUsernames('Li Wei')).toEqual(['liwei', 'li_wei']);
  });

  it('işaretlenen adayı önermez', () => {
    // "qwerty" klavye dizisi; alt çizgili ve ilk-kelime adayları da elenir.
    expect(suggestUsernames('Qwerty')).toEqual([]);
    expect(suggestUsernames('29384756')).toEqual([]);
  });

  it('en fazla 3 aday döner ve 30 karakteri aşmaz', () => {
    const suggestions = suggestUsernames('Abdülhamit Süleyman Çağatay Yıldırımoğlu');
    expect(suggestions.length).toBeLessThanOrEqual(3);
    suggestions.forEach(suggestion => expect(suggestion.length).toBeLessThanOrEqual(30));
    expect(suggestions.some(suggestion => suggestion.endsWith('_'))).toBe(false);
  });

  it('boş ya da harfsiz görünen adda aday üretmez', () => {
    expect(suggestUsernames('')).toEqual([]);
    expect(suggestUsernames('   ')).toEqual([]);
    expect(suggestUsernames('李偉')).toEqual([]);
  });
});
