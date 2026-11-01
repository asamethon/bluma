/**
 * Kullanıcı adı geçmişi.
 *
 * Ad değişince eski ad `users/{uid}.previousUsernames` içinde saklanır. İki işe
 * yarar: eski `@bahsetme`ler çözülmeye devam eder ve eski adı BAŞKASI alamaz —
 * yoksa bir kullanıcının eski etiketleri bir yabancıya giderdi.
 */

/** Sonsuza kadar tutmanın anlamı yok; son 5 ad pratikte fazlasıyla yeter. */
export const USERNAME_HISTORY_LIMIT = 5;

/**
 * Eski adı listenin başına alır; tekrarları eler, son 5'i tutar.
 *
 * `adopted` (yeni ad) de listeden çıkarılır: kendi eski adına dönen kullanıcı
 * aksi hâlde güncel adını geçmişinde taşır, bu da `checkUsernameAvailability`
 * için kendi adını "başkasının eski adı" gibi gösterecek bir çelişkidir.
 */
export function nextPreviousUsernames(
  current: string[] | undefined,
  retired: string,
  adopted = '',
): string[] {
  const kept = (current ?? []).filter(name => !!name && name !== retired && name !== adopted);
  return (retired ? [retired, ...kept] : kept).slice(0, USERNAME_HISTORY_LIMIT);
}
