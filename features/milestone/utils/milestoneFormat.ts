/** Kart üzerindeki sayılar dilin kendi gruplamasıyla yazılır (tr: 1.000, en: 1,000). */
export function formatNumber(value: number, language: string): string {
  try {
    return new Intl.NumberFormat(language).format(value);
  } catch {
    return String(value);
  }
}

/** Katılış tarihi; bilinmiyorsa boş döner ve kart o satırı çizmez. */
export function formatJoinDate(millis: number, language: string): string {
  if (!millis) return '';
  try {
    return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(millis));
  } catch {
    return new Date(millis).toISOString().slice(0, 10);
  }
}
