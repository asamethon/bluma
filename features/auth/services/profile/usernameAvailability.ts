import { normalizeUsername } from '@/features/auth/utils/usernameNormalize';
import { logger } from '@/utils/logger';
import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';

export async function checkUsernameAvailability(username: string) {
  try {
    const normalized = normalizeUsername(username);
    if (!normalized) return false;
    const snapshot = await getDocs(query(collection(getFirestore(), 'users'), where('username', '==', normalized)));
    return snapshot.empty;
  } catch (error) {
    logger.error('Username availability check error:', error);
    return false;
  }
}
