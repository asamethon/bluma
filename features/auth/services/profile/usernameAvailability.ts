import { normalizeUsername } from '@/features/auth/utils/usernameNormalize';
import { store } from '@/store';
import { logger } from '@/utils/logger';
import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';

/**
 * Bir kullanıcı adı, BAŞKASININ güncel adıysa ya da BAŞKASININ eski adıysa
 * müsait değildir. İkincisi şart: eski adı bir yabancı alırsa, o kişiye ait
 * eski `@bahsetme`ler yabancıya gitmeye başlar.
 *
 * Kullanıcı kendi eski adına geri dönebilir — kendi kayıtları engel sayılmaz.
 */
export async function checkUsernameAvailability(username: string) {
  try {
    const normalized = normalizeUsername(username);
    if (!normalized) return false;
    const users = collection(getFirestore(), 'users');
    const [taken, retired] = await Promise.all([
      getDocs(query(users, where('username', '==', normalized))),
      getDocs(query(users, where('previousUsernames', 'array-contains', normalized))),
    ]);
    const currentId = store.getState().auth.user?.id;
    return [...taken.docs, ...retired.docs].every(docSnap => docSnap.id === currentId);
  } catch (error) {
    logger.error('Username availability check error:', error);
    return false;
  }
}
