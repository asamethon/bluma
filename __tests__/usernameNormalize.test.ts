import { normalizeUsername, USERNAME_MAX_LENGTH } from '@/features/auth/utils/usernameNormalize';

describe('normalizeUsername', () => {
  it('Türkçe harfleri silmek yerine çevirir', () => {
    // Eski filtre bu adları "zgr", "mge", "aye", "kr", "gkeylmaz" yapıyordu.
    expect(normalizeUsername('Özgür')).toBe('ozgur');
    expect(normalizeUsername('Müge')).toBe('muge');
    expect(normalizeUsername('Ayşe')).toBe('ayse');
    expect(normalizeUsername('Şükrü')).toBe('sukru');
    expect(normalizeUsername('Gökçe Yılmaz')).toBe('gokceyilmaz');
  });

  it('büyük İ ve ı harflerini i yapar', () => {
    expect(normalizeUsername('İlayda')).toBe('ilayda');
    expect(normalizeUsername('Işık')).toBe('isik');
    expect(normalizeUsername('IĞDIR')).toBe('igdir');
  });

  it('Almanca adları çevirir', () => {
    expect(normalizeUsername('Jürgen Müller')).toBe('jurgenmuller');
    expect(normalizeUsername('Weiß')).toBe('weiss');
    expect(normalizeUsername('Käthe Schröder')).toBe('katheschroder');
  });

  it('Portekizce adları çevirir', () => {
    expect(normalizeUsername('João Gonçalves')).toBe('joaogoncalves');
    expect(normalizeUsername('Conceição')).toBe('conceicao');
    expect(normalizeUsername('Luís Antônio')).toBe('luisantonio');
  });

  it('İspanyolca adları çevirir', () => {
    expect(normalizeUsername('Begoña Muñoz')).toBe('begonamunoz');
    expect(normalizeUsername('José Ramírez')).toBe('joseramirez');
  });

  it('Endonezce adlara dokunmaz', () => {
    expect(normalizeUsername('Budi Santoso')).toBe('budisantoso');
    expect(normalizeUsername('Ayu Lestari')).toBe('ayulestari');
  });

  it('NFD ile ayrışmayan Latin harflerini de korur', () => {
    expect(normalizeUsername('Søren')).toBe('soren');
    expect(normalizeUsername('Æsa')).toBe('aesa');
    expect(normalizeUsername('Paweł Łukasz')).toBe('pawellukasz');
  });

  it('boşluk, noktalama ve emojiyi atar, alt çizgiyi ve rakamı tutar', () => {
    expect(normalizeUsername('  Elif   Nur  ')).toBe('elifnur');
    expect(normalizeUsername('ayse_yazar')).toBe('ayse_yazar');
    expect(normalizeUsername('Mehmet 1987')).toBe('mehmet1987');
    expect(normalizeUsername('zeynep.kaya')).toBe('zeynepkaya');
    expect(normalizeUsername('okur 📚 kurdu')).toBe('okurkurdu');
    expect(normalizeUsername('kitap-kurdu')).toBe('kitapkurdu');
  });

  it('Latin dışı yazıları eler (aksan bırakmaz)', () => {
    expect(normalizeUsername('Ωμέγα')).toBe('');
    expect(normalizeUsername('李偉')).toBe('');
  });

  it('en fazla 30 karakter döndürür', () => {
    const long = normalizeUsername('Abdülhamit Süleyman Çağatay Yıldırımoğlu');
    expect(long).toHaveLength(USERNAME_MAX_LENGTH);
    expect(long).toBe('abdulhamitsuleymancagatayyildi');
  });

  it('boş ve geçersiz girdide boş döner', () => {
    expect(normalizeUsername('')).toBe('');
    expect(normalizeUsername('   ')).toBe('');
    expect(normalizeUsername('!!!')).toBe('');
  });

  it('idempotenttir', () => {
    const once = normalizeUsername('Gökçe Yılmaz');
    expect(normalizeUsername(once)).toBe(once);
  });
});
