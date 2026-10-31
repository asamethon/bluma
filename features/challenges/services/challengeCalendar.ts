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

/**
 * Hafta sonu maratonu penceresi: Cuma 00:00 – Pazar 23:59 (yerel takvim).
 * `days`: pencerede bugün dahil kalan gün (Cuma 3 … Pazar 1); dışında
 * Cuma'ya kalan gün (Pazartesi 4 … Perşembe 1). Pazartesi başlayan hafta
 * sıfırlaması pencerenin bittiği anla aynıdır.
 */
export function weekendStatus(now = new Date()): { active: boolean; days: number } {
  const day = now.getDay();
  if (day === 0) return { active: true, days: 1 };
  if (day >= 5) return { active: true, days: 8 - day };
  return { active: false, days: 5 - day };
}
