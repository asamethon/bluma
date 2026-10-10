import { API_SERVER_URL } from '@/constants/config';
import { endSession } from '@/features/auth/services/sessionState';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import i18n from '@/i18n';
import { store } from '@/store';
import { patchAuth } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import { deleteUser, getAuth, getIdToken, signOut } from '@react-native-firebase/auth';
import { deleteAccountData } from './accountDataDeletion';
import { reauthenticateForDeletion, reauthenticationMessage } from './accountReauthentication';

async function clearLocalState(userId: string) {
  await endSession({ asGuest: true });
  await signOut(getAuth()).catch(() => undefined);
  await readingProgressActions.clearReadingProgressCache(userId);
}

async function deleteThroughServer(userId: string, firebaseUser: any) {
  const token = await getIdToken(firebaseUser);
  const response = await fetch(`${API_SERVER_URL}/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok || !result.success) return { success: false, error: result.error || i18n.t('account.deleteFailed') };
  await clearLocalState(userId);
  return { success: true };
}

export async function deleteAccount(password?: string) {
  const user = store.getState().auth.user;
  const firebaseUser = getAuth().currentUser;
  if (!user || !firebaseUser) return { success: false, error: i18n.t('errors.userNotFound') };
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    if (API_SERVER_URL) return await deleteThroughServer(user.id, firebaseUser);
    try {
      await reauthenticateForDeletion(user, firebaseUser, password);
    } catch (error) {
      return { success: false, error: reauthenticationMessage(error) };
    }
    await deleteAccountData(user);
    await deleteUser(firebaseUser);
    await clearLocalState(user.id);
    return { success: true };
  } catch (error: any) {
    logger.error('Account deletion error:', error);
    if (error?.code === 'auth/requires-recent-login') return { success: false, error: i18n.t('account.deleteNeedsPassword') };
    if (error?.code === 'auth/user-not-found') return { success: false, error: i18n.t('errors.userNotFound') };
    if (error?.code === 'auth/network-request-failed') return { success: false, error: i18n.t('authErrors.network') };
    if (API_SERVER_URL) return { success: false, error: i18n.t('errors.serverUnreachable') };
    return { success: false, error: i18n.t('account.deleteFailed') };
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}
