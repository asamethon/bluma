/**
 * Kullanıcı adı geçmişi.
 *
 * Ad değişince eski ad `users/{uid}.previousUsernames` içinde saklanır. İki işe
 * yarar: eski `@bahsetme`ler çözülmeye devam eder ve eski adı BAŞKASI alamaz —
 * yoksa bir kullanıcının eski etiketleri bir yabancıya giderdi.
 */

/** Sonsuza kadar tutmanın anlamı yok; son 5 ad pratikte fazlasıyla yeter. */
export const USERNAME_HISTORY_LIMIT = 5;

/** Eski adı listenin başına alır; tekrarları eler, son 5'i tutar. */
export function nextPreviousUsernames(current: string[] | undefined, retired: string): string[] {
  if (!retired) return current ?? [];
  const rest = (current ?? []).filter(name => name && name !== retired);
  return [retired, ...rest].slice(0, USERNAME_HISTORY_LIMIT);
}
