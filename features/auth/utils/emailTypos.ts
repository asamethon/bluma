/**
 * Yaygın e-posta alan adı yazım hatalarını yakalar ("gmial.com" → "gmail.com").
 *
 * Amaç engellemek değil, kullanıcıya sormak: yanlış adrese kaydolan kişi
 * doğrulama postasını hiç alamaz ve neden yazamadığını da anlamaz.
 */
const POPULAR_DOMAINS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'live.com',
  'msn.com', 'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'gmx.com', 'gmx.net', 'proton.me', 'protonmail.com',
  'yandex.com', 'yandex.ru', 'mail.ru', 'mynet.com', 'superonline.com',
  'windowslive.com', 'hey.com', 'zoho.com',
];

/**
 * Damerau-Levenshtein — komşu harflerin yer değiştirmesi (gmial → gmail) TEK
 * hata sayılır. En sık yapılan yazım hatası budur; düz Levenshtein onu 2
 * sayıp kaçırıyordu.
 */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: b.length + 1 }, (_, i) => [i, ...Array(a.length).fill(0)]);
  for (let j = 1; j <= a.length; j++) rows[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
      );
      if (i > 1 && j > 1 && a[j - 1] === b[i - 2] && a[j - 2] === b[i - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[b.length][a.length];
}

/** Düzeltme önerisi ya da tam/tanınmayan adreste null. */
export function suggestEmailFix(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  if (!local || !domain) return null;
  if (POPULAR_DOMAINS.includes(domain)) return null;

  for (const candidate of POPULAR_DOMAINS) {
    // 1-2 karakterlik sapma yazım hatasıdır; daha uzağı başka bir sağlayıcı
    // olabilir, ona karışmayız.
    const limit = candidate.length <= 9 ? 1 : 2;
    if (distance(domain, candidate) <= limit) return `${local}@${candidate}`;
  }
  return null;
}
