import { signOutFromGoogle } from '@/config/googleSignIn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { patchAuth } from '@/store/slices/authSlice';
import { store } from '@/store';
import { logger } from '@/utils/logger';
import { endSession } from './sessionState';

export async function signOut() {
  try {
    store.dispatch(patchAuth({ isLoading: true }));

    const signingOutUserId = store.getState().auth.user?.id;
    if (signingOutUserId) {
      const { readingProgressActions } = await import('@/features/story/services/readingProgress');
      await readingProgressActions.clearReadingProgressCache(signingOutUserId);

      const { pushNotificationService } = await import('@/services/pushNotificationService');
      await pushNotificationService.removeUserPushToken(signingOutUserId);
    }

    const [{ notificationActions }, { conversationActions }] = await Promise.all([
      import('@/store/notificationStore'),
      import('@/store/conversationStore'),
    ]);
    notificationActions.cleanupNotificationsListener();
    conversationActions.cleanupListeners();

    const authProvider = await AsyncStorage.getItem('authProvider');

    // Önce yerel durum temizlenir ki auth dinleyicisi tekrar oturum kurmaya çalışmasın.
    await endSession({ asGuest: true });
    await firebaseSignOut(getAuth());
    if (authProvider === 'google') await signOutFromGoogle();

    logger.debug('Sign out successful');
  } catch (error) {
    logger.error('Sign out error:', error);
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}

export function continueAsGuest() {
  store.dispatch(patchAuth({
    isGuest: true,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    isLoading: false,
  }));
}
