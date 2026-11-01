/**
 * Görünen addan kullanıcı adı üretirken Türkçe (ve diğer Latin) harfleri
 * SİLMEK yerine ASCII karşılığına ÇEVİRİR.
 *
 * Eski filtre `raw.toLowerCase().replace(/[^a-z0-9_]/g, '')` idi: aksanlı
 * harfler elenince "Özgür" → "zgr", "Gökçe Yılmaz" → "gkeylmaz" oluyordu.
 * Rastgele görünen kullanıcı adlarının bir kısmını bu yüzden biz ürettik.
 */

/** Kullanıcı adı üst sınırı — @bahsetme ve profil başlıklarına sığacak uzunluk. */
export const USERNAME_MAX_LENGTH = 30;

/**
 * NFD ile ayrışmayan ya da ayrıştığında yanlış sonuç veren harfler.
 * Türkçe `İ` küçültülünce `i` + birleştirici nokta oluyor; aşağıdaki eşleme
 * bunu ve ß→ss gibi tek harfin iki harfe açıldığı durumları garanti eder.
 */
const CHAR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', I: 'i', İ: 'i', i: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
  ß: 'ss',
  // NFD'nin ayrıştırmadığı yaygın Latin harfleri — bunlar da silinmesin.
  æ: 'ae', Æ: 'ae',
  œ: 'oe', Œ: 'oe',
  ø: 'o', Ø: 'o',
  đ: 'd', Đ: 'd', ð: 'd', Ð: 'd',
  ł: 'l', Ł: 'l',
  þ: 'th', Þ: 'th',
};

/** Birleştirici aksan işaretleri (NFD sonrası kalan kuyruklar). */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Hermes'te `normalize` yoksa eşleme katmanı tek başına çalışmaya devam eder. */
function stripAccents(value: string): string {
  if (typeof value.normalize !== 'function') return value;
  return value.normalize('NFD').replace(COMBINING_MARKS, '');
}

/**
 * Serbest metni geçerli bir kullanıcı adına çevirir.
 * Sıra önemli: harf eşlemesi → küçük harf → aksan temizliği → filtre.
 */
export function normalizeUsername(raw: string): string {
  if (!raw) return '';
  const mapped = Array.from(raw).map(char => CHAR_MAP[char] ?? char).join('');
  return stripAccents(mapped.toLowerCase())
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, USERNAME_MAX_LENGTH);
}
