import type { User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import { getAuth } from '@react-native-firebase/auth';
import {
  deleteField,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import type { SignupContext } from './signupContext';

/**
 * Kişisel veri `users/{uid}` dokümanında DURAMAZ: o doküman misafir
 * gezinmesi için herkese açık okunur VE listelenebilir — yani e-posta,
 * cihaz modeli, işletim sistemi ve bölge uygulamanın Firebase yapılandırması
 * olan herkes tarafından toplanabiliyordu (KVKK/GDPR ihlali).
 *
 * Bu alanlar artık yalnızca sahibinin okuyabildiği
 * `users/{uid}/private/account` dokümanında durur (bkz. firestore.rules).
 */
export type PrivateAccount = Partial<SignupContext> & {
  email?: string;
  appleUserId?: string;
};

/** Herkese açık profil dokümanına ASLA yazılmayacak alanlar. */
const PERSONAL_FIELDS = [
  'email',
  'appleUserId',
  'signupPlatform',
  'signupOsVersion',
  'signupAppVersion',
  'signupDeviceModel',
  'signupLanguage',
  'signupRegion',
] as const;

const privateRef = (userId: string) => doc(getFirestore(), 'users', userId, 'private', 'account');

export async function writePrivateAccount(userId: string, data: PrivateAccount) {
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  if (!Object.keys(payload).length) return;
  await setDoc(privateRef(userId), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
}

export async function readPrivateAccount(userId: string): Promise<PrivateAccount | null> {
  try {
    const snapshot = await getDoc(privateRef(userId));
    return snapshot.exists() ? (snapshot.data() as PrivateAccount) : null;
  } catch (error) {
    logger.debug('Özel hesap dokümanı okunamadı:', error);
    return null;
  }
}

/** Verilen nesneden kişisel alanları ayıklar (herkese açık yazmalar için). */
export function withoutPersonalFields<T extends object>(data: T): Partial<T> {
  const clean = { ...data } as Record<string, unknown>;
  for (const field of PERSONAL_FIELDS) delete clean[field];
  return clean as Partial<T>;
}

/**
 * Herkese açık profil dokümanını oturumun kişisel alanlarıyla tamamlar:
 * e-posta Auth'tan (tek doğru kaynak), `appleUserId` önceki oturumdan.
 * Böylece veri Firestore'da herkese açık durmaz ama ayarlar ekranı ve
 * Apple yeniden kimlik doğrulaması çalışmaya devam eder.
 */
export function hydrateUserDoc(
  id: string,
  publicData: Record<string, unknown>,
  previous?: User | null,
): User {
  return {
    ...withoutPersonalFields(publicData),
    id,
    email: getAuth().currentUser?.email ?? previous?.email ?? '',
    ...(previous?.appleUserId ? { appleUserId: previous.appleUserId } : {}),
  } as User;
}

/**
 * Eski sürümlerin herkese açık dokümana yazdığı kişisel alanları özel
 * dokümana taşır. SIRA ÖNEMLİ: önce yazılır, sonra silinir — tersi, yazma
 * başarısız olduğunda veriyi tümden kaybettirir.
 */
export async function migratePublicPersonalFields(
  userId: string,
  publicData: Record<string, unknown>,
) {
  const leaked = PERSONAL_FIELDS.filter(field => publicData[field] !== undefined);
  if (!leaked.length) return;

  try {
    await writePrivateAccount(
      userId,
      Object.fromEntries(leaked.map(field => [field, publicData[field]])) as PrivateAccount,
    );
    await setDoc(
      doc(getFirestore(), 'users', userId),
      Object.fromEntries(leaked.map(field => [field, deleteField()])),
      { merge: true },
    );
  } catch (error) {
    logger.debug('Kişisel alanlar özel dokümana taşınamadı:', error);
  }
}
