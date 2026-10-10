import { privacyActions } from '@/features/privacy/services/privacyService';
import type { User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';

/** Firestore ön ek aramasının üst sınır karakteri. */
const PREFIX_END = '\uf8ff';
const MAX_RESULTS = 20;

async function prefixMatches(field: 'username' | 'displayName', value: string): Promise<User[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirestore(), 'users'),
      where(field, '>=', value),
      where(field, '<=', value + PREFIX_END),
    ),
  );
  return snapshot.docs.map(document => ({ id: document.id, ...document.data() }) as User);
}

/** Tam eşleşme → kullanıcı adı ön eki → görünen ad ön eki → takipçi sayısı. */
const byRelevance = (term: string) => (a: User, b: User) => {
  const rank = (user: User) => {
    const username = user.username?.toLowerCase() ?? '';
    const displayName = user.displayName?.toLowerCase() ?? '';
    if (username === term) return 0;
    if (username.startsWith(term)) return 1;
    if (displayName.startsWith(term)) return 2;
    return 3;
  };
  return rank(a) - rank(b) || (b.followersCount ?? 0) - (a.followersCount ?? 0);
};

export async function searchUsers(searchQuery: string): Promise<User[]> {
  const term = searchQuery.toLowerCase().trim();
  if (term.length < 2) return [];

  try {
    // Görünen ad büyük harfle kaydedilmiş olabilir; iki varyant da taranır.
    const capitalized = term.charAt(0).toLocaleUpperCase('tr-TR') + term.slice(1);
    const variants = [...new Set([term, capitalized])];
    const results = await Promise.all([
      prefixMatches('username', term),
      ...variants.map(variant => prefixMatches('displayName', variant)),
    ]);

    const unique = new Map(results.flat().map(user => [user.id, user]));
    // "Aramada göster" kapalı hesaplar sonuçlardan düşer.
    return privacyActions
      .filterDiscoverable([...unique.values()].sort(byRelevance(term)))
      .slice(0, MAX_RESULTS);
  } catch (error) {
    logger.error('Search users error:', error);
    return [];
  }
}
