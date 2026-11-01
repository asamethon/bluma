import { checkUsernameAvailability } from '@/features/auth/services/profile/usernameAvailability';
import { USERNAME_MAX_LENGTH } from '@/features/auth/utils/usernameNormalize';

/** Kullanıcıyı bekletmemek için sorgu bütçesi dar: en fazla 3 Firestore okuması. */
const MAX_QUERIES = 3;
const WANTED = 2;

type Options = {
  /** Testlerde (ve ileride başka bir kaynakta) değiştirilebilir. */
  isAvailable?: (username: string) => Promise<boolean>;
  /** Hepsi doluyken eklenecek iki haneli sayı. */
  suffix?: () => number;
};

const randomSuffix = () => 10 + Math.floor(Math.random() * 90);

/**
 * Adayları sırayla dener ve ilk 2 müsait olanı döndürür.
 * Hiçbiri müsait değilse ilk adaya iki haneli bir sayı ekler — bu son aday
 * sorgulanmaz, çünkü sorgu bütçesi dolmuştur; müsaitliği kaydederken
 * `checkUsernameAvailability` zaten yeniden doğrulanır.
 */
export async function pickAvailableUsernames(candidates: string[], options: Options = {}): Promise<string[]> {
  const isAvailable = options.isAvailable ?? checkUsernameAvailability;
  const available: string[] = [];
  for (const candidate of candidates.slice(0, MAX_QUERIES)) {
    if (await isAvailable(candidate)) available.push(candidate);
    if (available.length === WANTED) return available;
  }
  if (available.length) return available;
  const base = candidates[0];
  if (!base) return [];
  const suffix = (options.suffix ?? randomSuffix)();
  return [`${base.slice(0, USERNAME_MAX_LENGTH - 2)}${suffix}`];
}
