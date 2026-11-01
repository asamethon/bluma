import { primeCachedUser } from '@/features/auth/services/userCache';
import { nextPreviousUsernames } from '@/features/auth/utils/usernameHistory';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth, type User } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserProfile } from '../profileRepository';

export async function updateUserProfile(user: User) {
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    // Ad değiştiyse eskisini geçmişe al: eski @bahsetmeler çözülmeye devam
    // etsin ve eski adı başkası alamasın.
    const previous = store.getState().auth.user;
    const renamed = !!previous?.username && !!user.username && previous.username !== user.username;
    const payload = renamed
      ? { ...user, previousUsernames: nextPreviousUsernames(previous.previousUsernames, previous.username!) }
      : user;
    await saveUserProfile(payload);
    await AsyncStorage.setItem('userData', JSON.stringify(payload));
    store.dispatch(patchAuth({ user: payload }));
    primeCachedUser(payload);
    return { success: true };
  } catch (error) {
    logger.error('Profile update error:', error);
    return { success: false, error: i18n.t('account.profileUpdateFailed') };
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}
