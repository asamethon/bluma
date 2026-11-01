import {
  doc,
  getDoc,
  getFirestore,
} from '@react-native-firebase/firestore';
import { User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import { publicProfileData } from './profilePrivacy';

// Yazar adı/avatarı nadiren değişir; kısa TTL her akış yüklemesinde onlarca
// kullanıcı dokümanını yeniden okutuyordu. Kendi profil değişikliği zaten
// `primeCachedUser` / `invalidateCachedUser` ile anında yansır.
const TTL_MS = 30 * 60 * 1000;

/**
 * Kullanıcı okumasının ÜÇ ayrı sonucu vardır ve bunlar karıştırılmamalı:
 *
 * - `found`    : doküman var, kullanıcı canlı.
 * - `missing`  : `users/{id}` dokümanı YOK — hesap silinmiş ("hayalet").
 * - `unreadable`: okuma başarısız (ağ kopması, kota, geçici hata). Hesabın
 *                 silindiği ANLAMINA GELMEZ.
 *
 * Eskiden üçü de `null` dönüyordu ve üçü de önbelleğe yazılıyordu: tek bir ağ
 * hıçkırığı gerçek bir takipçiyi 30 dakika boyunca listeden siliyordu. Takipçi
 * sayısının profilde 6, listede 5 görünmesinin sebeplerinden biri budur.
 */
export type UserLookup =
  | { state: 'found'; user: User }
  | { state: 'missing' }
  | { state: 'unreadable' };

const cache = new Map<string, { lookup: UserLookup; at: number }>();
const inFlight = new Map<string, Promise<UserLookup>>();

export function invalidateCachedUser(userId?: string) {
  if (userId) cache.delete(userId);
  else cache.clear();
}

export function primeCachedUser(user: User) {
  const cached = publicProfileData(user) as unknown as User;
  cache.set(user.id, { lookup: { state: 'found', user: cached }, at: Date.now() });
}

async function fetchUserById(userId: string): Promise<UserLookup> {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { state: 'missing' };
    return { state: 'found', user: { ...publicProfileData(userDoc.data()!), id: userDoc.id } as User };
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return { state: 'unreadable' };
  }
}

/** Ham sonuç: "yok" ile "okunamadı"yı ayırt etmesi gereken çağıranlar için. */
export async function lookupUserById(userId: string): Promise<UserLookup> {
  if (!userId || typeof userId !== 'string') return { state: 'missing' };

  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.lookup;

  const pending = inFlight.get(userId);
  if (pending) return pending;

  const promise = fetchUserById(userId)
    .then(lookup => {
      // Okunamayan sonuç ÖNBELLEĞE ALINMAZ: geçici bir hata kalıcı bir
      // "bu kullanıcı yok" cevabına dönüşmemeli.
      if (lookup.state !== 'unreadable') cache.set(userId, { lookup, at: Date.now() });
      return lookup;
    })
    .finally(() => {
      inFlight.delete(userId);
    });

  inFlight.set(userId, promise);
  return promise;
}

export async function getUserById(userId: string): Promise<User | null> {
  const lookup = await lookupUserById(userId);
  return lookup.state === 'found' ? lookup.user : null;
}
