import { withoutPersonalFields } from '../privateAccount';

/**
 * İstemcinin profil formundan ASLA yazmaması gereken alanlar: sayaçlar,
 * oyunlaştırma durumu ve oluşturma damgaları. Bunları karşı taraf (takip
 * akışı), atomik `increment()` çağrıları ya da görev servisi yönetir.
 *
 * Profil kaydetme Redux'taki kullanıcı nesnesinin TAMAMINI yazıyordu; yani
 * ekran açıldığından beri değişen takipçi sayısı ya da XP, eski bir anlık
 * görüntüden geri yazılıyordu. Güvenlik kuralı (bkz. firestore.rules →
 * userProtected) artık böyle bir yazmayı tümden reddediyor.
 */
const MANAGED_FIELDS = [
  'followersCount',
  'followingCount',
  'storiesCount',
  'xp',
  'streak',
  'lastActiveDate',
  'lastActiveAt',
  'challengeWeekStart',
  'challengeProgress',
  'claimedChallenges',
  'createdAt',
] as const;

/** Profil formundan herkese açık dokümana yazılabilecek alanlar. */
export function profileWritePayload<T extends object>(user: T): Partial<T> {
  const clean = withoutPersonalFields(user) as Record<string, unknown>;
  for (const field of MANAGED_FIELDS) delete clean[field];
  return clean as Partial<T>;
}
