import i18n from '@/i18n';

function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Firestore Timestamp | Date | ISO metin → ms (yoksa 0).
export function toMillis(ts: any): number {
  const d = toDate(ts);
  return d ? d.getTime() : 0;
}

// Baloncuğun sağ alt köşesindeki saat (14:32).
export function formatClock(ts: any): string {
  const d = toDate(ts);
  return d ? clock(d) : '';
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function formatThreadTime(ts: any): string {
  const d = toDate(ts);
  if (!d) return '';
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return i18n.t('time.now');
  if (diffMin < 60) return i18n.t('time.minutesShort', { count: diffMin });
  if (isSameDay(d, now)) return clock(d);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return i18n.t('time.yesterday');
  if (now.getTime() - d.getTime() < 7 * 86400000) {
    return d.toLocaleDateString(i18n.language, { weekday: 'long' });
  }
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

export function formatMessageStamp(ts: any): string {
  const d = toDate(ts);
  if (!d) return i18n.t('time.now');
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, now)) return i18n.t('time.todayAt', { time: clock(d) });
  if (isSameDay(d, yesterday)) return i18n.t('time.yesterdayAt', { time: clock(d) });
  const dateLabel = d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
  return `${dateLabel} ${clock(d)}`;
}

/** Sesli mesaj sayacı: 0:07 / 1:42 (saat gerekmez, kayıt 2 dakikayla sınırlı). */
export function formatVoiceDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

export function shouldShowStamp(prev: any, curr: any): boolean {
  const a = toDate(prev);
  const b = toDate(curr);
  if (!b) return false;
  if (!a) return true;
  return b.getTime() - a.getTime() > 5 * 60000;
}
