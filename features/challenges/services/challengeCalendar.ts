/**
 * Gün anahtarları YEREL takvime göre üretilir. `toISOString()` UTC'ye çevirdiği
 * için UTC+3'te gece yarısı ile 03:00 arasındaki kullanım "dün" sayılıyor,
 * hafta başı da pazar olarak hesaplanıyordu.
 */
const dayKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

export const todayKey = () => dayKey(new Date());

export function yesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dayKey(date);
}

/** Haftalık görevlerin sıfırlandığı gün (pazartesi). */
export function weekStartKey(): string {
  const now = new Date();
  const weekday = now.getDay();
  const monday = now.getDate() - weekday + (weekday === 0 ? -6 : 1);
  return dayKey(new Date(now.getFullYear(), now.getMonth(), monday));
}

export function getDaysLeftInWeekend(): number {
  const now = new Date();
  const day = now.getDay(); // 0 Pazar, 1 Pazartesi, ..., 6 Cumartesi
  if (day === 0 || day === 6) {
    return day === 6 ? 1 : 0;
  }
  if (day === 5) {
    return 2; // Cuma -> Cumartesi + Pazar
  }
  return 0;
}

export function isWeekendOrFriday(): boolean {
  const now = new Date();
  const day = now.getDay();
  return day === 5 || day === 6 || day === 0;
}
