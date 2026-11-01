/**
 * Firestore Timestamp, Date, sayı ya da metin → milisaniye (bilinmiyorsa 0).
 *
 * Hikâye akışı, sıralama ve sayfalama aynı dönüşümü kullanıyor; ayrı
 * kopyalarda tutulduğunda biri `toMillis()` metodunu, biri `toDate()`
 * metodunu desteklemiyordu.
 */
export function toMillis(value: unknown): number {
  if (!value) return 0;
  const stamp = value as { toMillis?: () => number; toDate?: () => Date };
  if (typeof stamp.toMillis === 'function') return stamp.toMillis();
  if (typeof stamp.toDate === 'function') return stamp.toDate().getTime();
  const parsed = new Date(value as string | number | Date).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
