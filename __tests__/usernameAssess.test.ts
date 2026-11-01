import { assessUsername, type UsernameFlagReason } from '@/features/profile/utils/usernameAssess';

/**
 * Bu iki liste sözleşmedir: ikinci listedeki hiçbir ad asla işaretlenmemeli.
 * Yanlış pozitif, kaçırmaktan kötüdür.
 */
const MUST_NOT_FLAG: [username: string, displayName: string][] = [
  ['mehmet1987', 'Mehmet Yılmaz'],
  ['elif_35', 'Elif'],
  ['zeynep2008', 'Zeynep Kaya'],
  ['ayse_yazar', 'Ayşe Demir'],
  ['mhmd', 'Mehmet'],
  ['kitapkurdu', 'Selin'],
  ['budi_santoso', 'Budi Santoso'],
  ['yuki_tanaka', 'Yuki Tanaka'],
  ['ahmad99', 'Ahmad'],
  ['li_wei', 'Li Wei'],
  ['kim_minji', 'Kim Min-ji'],
];

const MUST_FLAG: [username: string, displayName: string, reason: UsernameFlagReason][] = [
  ['zgr', 'Özgür', 'mangled'],
  ['mge', 'Müge', 'mangled'],
  ['aye', 'Ayşe', 'mangled'],
  ['kr', 'Şükrü', 'mangled'],
  ['gkeylmaz', 'Gökçe Yılmaz', 'mangled'],
  ['a8f3k2x9', '', 'mixed'],
  ['user48213', '', 'digits'],
  ['29384756', '', 'digits'],
  ['asdasd', '', 'keyboard'],
  ['qwerty', '', 'keyboard'],
  ['asdfgh', '', 'keyboard'],
  ['zxcvbn', '', 'keyboard'],
];

describe('assessUsername', () => {
  it.each(MUST_NOT_FLAG)('%s adını işaretlemez', (username, displayName) => {
    expect(assessUsername(username, displayName)).toEqual({ flagged: false });
  });

  it.each(MUST_NOT_FLAG)('%s adını görünen ad olmadan da işaretlemez', (username) => {
    expect(assessUsername(username).flagged).toBe(false);
  });

  it.each(MUST_FLAG)('%s adını %s için işaretler', (username, displayName, reason) => {
    expect(assessUsername(username, displayName)).toEqual({ flagged: true, reason });
  });

  describe('mangled', () => {
    it('görünen adın ilk kelimesinden bozulmuş adı yakalar', () => {
      expect(assessUsername('zgr', 'Özgür Demir')).toEqual({ flagged: true, reason: 'mangled' });
    });

    it('doğru normalleşmiş ada dokunmaz', () => {
      expect(assessUsername('ozgur', 'Özgür').flagged).toBe(false);
      expect(assessUsername('gokceyilmaz', 'Gökçe Yılmaz').flagged).toBe(false);
    });

    it('aksansız adlarda tetiklenmez (eski filtre ile sonuç aynı)', () => {
      expect(assessUsername('budisantoso', 'Budi Santoso').flagged).toBe(false);
      expect(assessUsername('elif', 'Elif').flagged).toBe(false);
    });

    it('kullanıcı adı görünen adla ilgisizse tetiklenmez', () => {
      expect(assessUsername('kitapkurdu', 'Gökçe Yılmaz').flagged).toBe(false);
    });

    it('görünen ad yoksa sessiz kalır', () => {
      expect(assessUsername('zgr').flagged).toBe(false);
    });
  });

  /**
   * Canlı ölçümden (852 kullanıcı) çıkan şekiller. Gerçek kullanıcı adları
   * repoya girmesin diye aynı yapıyı üreten uydurma adlar kullanılıyor.
   */
  describe('canlı ölçüm şekilleri', () => {
    it('eski filtrenin gerçekten bozduğu adları işaretler', () => {
      expect(assessUsername('nar', 'Çınar').reason).toBe('mangled');
      expect(assessUsername('glen', 'Gülşen').reason).toBe('mangled');
      expect(assessUsername('erefkaya', 'Şeref Kaya').reason).toBe('mangled');
      expect(assessUsername('yldzlar', 'Yıldızlar').reason).toBe('mangled');
    });

    it('temiz ilk adı, görünen adın ikinci kelimesi yüzünden işaretlemez', () => {
      // Ölçümde mangled'ın yanlış pozitiflerinin tamamı bu şekildeydi:
      // kullanıcı adı = kusursuz ilk ad, eski filtre o kelimeye hiç dokunmamış.
      expect(assessUsername('kerem', 'Kerem Balcı').flagged).toBe(false);
      expect(assessUsername('serap', 'Serap Aydın').flagged).toBe(false);
      expect(assessUsername('pelin', 'Pelin kaya').flagged).toBe(false);
      expect(assessUsername('lara', 'Lara Mz 🧸✨').flagged).toBe(false);
    });

    it('rakam yığınını tekrar değil rakam olarak açıklar', () => {
      expect(assessUsername('777', 'Elif Kaya')).toEqual({ flagged: true, reason: 'digits' });
      expect(assessUsername('_120', 'Mavii')).toEqual({ flagged: true, reason: 'digits' });
    });
  });

  describe('mixed', () => {
    it('harf-rakam gürültüsünü yakalar', () => {
      expect(assessUsername('a1b2c3x')).toEqual({ flagged: true, reason: 'mixed' });
    });

    it('tek geçişli ad-yıl kalıbına dokunmaz', () => {
      expect(assessUsername('elif2008').flagged).toBe(false);
      expect(assessUsername('elif2008kaya').flagged).toBe(false);
    });

    it('6 karakterden kısa adlarda tetiklenmez', () => {
      expect(assessUsername('a1b2').flagged).toBe(false);
    });
  });

  describe('digits', () => {
    it('5 ardışık rakamı yakalar', () => {
      expect(assessUsername('okur12345')).toEqual({ flagged: true, reason: 'digits' });
    });

    it('4 ardışık rakama (doğum yılı) dokunmaz', () => {
      expect(assessUsername('mehmet2008').flagged).toBe(false);
    });

    it('rakam oranı yarıdan fazlaysa yakalar', () => {
      expect(assessUsername('ab1234')).toEqual({ flagged: true, reason: 'digits' });
    });

    it('tam yarı rakamda işaretlemez', () => {
      expect(assessUsername('abc123').flagged).toBe(false);
    });
  });

  describe('noVowels', () => {
    it('6+ sessiz diziyi yakalar', () => {
      expect(assessUsername('schwrzkt')).toEqual({ flagged: true, reason: 'noVowels' });
    });

    it('y harfini sesli sayar', () => {
      expect(assessUsername('krzysztof').flagged).toBe(false);
    });

    it('kısa kısaltmalara dokunmaz', () => {
      expect(assessUsername('mhmd').flagged).toBe(false);
      expect(assessUsername('schmidt').flagged).toBe(false);
    });
  });

  describe('keyboard', () => {
    it('ters klavye dizisini de yakalar', () => {
      expect(assessUsername('ytrewq')).toEqual({ flagged: true, reason: 'keyboard' });
    });

    it('tek karakter tekrarını yakalar', () => {
      expect(assessUsername('aaaa')).toEqual({ flagged: true, reason: 'keyboard' });
    });

    it('kısa tekrarlı gerçek takma adlara dokunmaz', () => {
      expect(assessUsername('lili').flagged).toBe(false);
      expect(assessUsername('coco').flagged).toBe(false);
    });
  });

  it('boş ve çok kısa adlarda sessiz kalır', () => {
    expect(assessUsername('')).toEqual({ flagged: false });
    expect(assessUsername('ab')).toEqual({ flagged: false });
    expect(assessUsername('qw')).toEqual({ flagged: false });
  });
});
