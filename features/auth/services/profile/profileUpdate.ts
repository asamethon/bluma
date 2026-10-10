import { primeCachedUser } from '@/features/auth/services/userCache';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth, type User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';

export async function updateUserProfile(user: User) {
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    await setDoc(doc(getFirestore(), 'users', user.id), { ...user, updatedAt: serverTimestamp() }, { merge: true });
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    store.dispatch(patchAuth({ user }));
    primeCachedUser(user);
    return { success: true };
  } catch (error) {
    logger.error('Profile update error:', error);
    return { success: false, error: i18n.t('account.profileUpdateFailed') };
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}
