import { lookupUserById, type UserLookup } from '@/features/auth/services/userCache';
import type { User } from '@/types';
import { collection, doc, getDocs, getFirestore } from '@react-native-firebase/firestore';

/**
 * Takipçi/takip listesi, üç parçaya ayrılmış hâliyle.
 *
 * Alt koleksiyonda 6 doküman olup listede 5 kişi görünmesinin iki ayrı sebebi
 * var ve bunlar farklı şeyler:
 * - `ghosts`: `users/{id}` dokümanı yok — hesap silinmiş. Sayaç hâlâ sayıyor,
 *   düzeltmesi push-worker'daki `reconcile-counters` işinde (yalnız o, Auth'a
 *   da sorup "kaydı yarım kalmış gerçek kullanıcı"yı ayırt edebiliyor).
 * - `unreadable`: okuma başarısız oldu. Kişi duruyor, biz getiremedik.
 */
export type ConnectionList = {
  users: User[];
  ghosts: string[];
  unreadable: string[];
};

export type ProfileConnections = {
  followers: ConnectionList;
  following: ConnectionList;
};

/** Saf ayrıştırma: hangi id çözüldü, hangisi hayalet, hangisi okunamadı. */
export function partitionLookups(ids: string[], lookups: UserLookup[]): ConnectionList {
  const list: ConnectionList = { users: [], ghosts: [], unreadable: [] };
  ids.forEach((id, index) => {
    const lookup = lookups[index];
    if (lookup?.state === 'found') list.users.push(lookup.user as unknown as User);
    else if (lookup?.state === 'missing') list.ghosts.push(id);
    else list.unreadable.push(id);
  });
  return list;
}

async function resolveUsers(ids: string[]): Promise<ConnectionList> {
  const first = partitionLookups(ids, await Promise.all(ids.map(lookupUserById)));
  if (!first.unreadable.length) return first;
  // Geçici bir hata yüzünden liste sessizce kısalmasın diye tek deneme daha.
  // Okunamayan sonuç önbelleğe yazılmadığı için bu gerçekten yeniden dener.
  const retry = partitionLookups(
    first.unreadable,
    await Promise.all(first.unreadable.map(lookupUserById)),
  );
  return {
    users: [...first.users, ...retry.users],
    ghosts: [...first.ghosts, ...retry.ghosts],
    unreadable: retry.unreadable,
  };
}

export async function getProfileConnections(userId: string): Promise<ProfileConnections> {
  // `users/<id>` bir DOKÜMAN yolu: collection() burada 'must point to a
  // collection' hatası veriyordu.
  const userRef = doc(getFirestore(), 'users', userId);
  const [followers, following] = await Promise.all([
    getDocs(collection(userRef, 'followers')),
    getDocs(collection(userRef, 'following')),
  ]);

  const [resolvedFollowers, resolvedFollowing] = await Promise.all([
    resolveUsers(followers.docs.map(document => document.id)),
    resolveUsers(following.docs.map(document => document.id)),
  ]);

  return { followers: resolvedFollowers, following: resolvedFollowing };
}
