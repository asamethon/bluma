// DM zaman biçimlendirme yardımcıları. Firestore Timestamp | Date | null kabul eder.

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Sohbet listesindeki son mesaj zamanı (kısa, göz atılabilir).
export function formatThreadTime(ts: any): string {
  const d = toDate(ts);
  if (!d) return '';
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Şimdi';
  if (diffMin < 60) return `${diffMin} dk`;
  if (isSameDay(d, now)) return clock(d);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'Dün';
  if (now.getTime() - d.getTime() < 7 * 86400000) return GUNLER[d.getDay()];
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

// Sohbet ekranındaki gün/saat ayracı etiketi.
export function formatMessageStamp(ts: any): string {
  const d = toDate(ts);
  if (!d) return 'Şimdi';
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, now)) return `Bugün ${clock(d)}`;
  if (isSameDay(d, yesterday)) return `Dün ${clock(d)}`;
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${clock(d)}`;
}

// İki mesaj arasında yeni ayraç gösterilmeli mi? (5 dk'dan uzun boşlukta.)
export function shouldShowStamp(prev: any, curr: any): boolean {
  const a = toDate(prev);
  const b = toDate(curr);
  if (!b) return false;
  if (!a) return true;
  return b.getTime() - a.getTime() > 5 * 60000;
}
