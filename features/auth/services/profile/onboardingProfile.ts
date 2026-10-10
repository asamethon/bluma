import { imageUploadService } from '@/services/imageUploadService';
import { store } from '@/store';
import { patchAuth, type User } from '@/store/slices/authSlice';
import i18n from '@/i18n';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { checkUsernameAvailability } from './usernameAvailability';

type OnboardingProfile = {
  username: string;
  interests: string[];
  bio: string;
  displayName?: string;
  profileImage?: string | null;
  intent?: 'reader' | 'writer' | 'both';
};

export async function completeOnboarding(input: OnboardingProfile) {
  store.dispatch(patchAuth({ isLoading: true }));
  try {
    if (!await checkUsernameAvailability(input.username)) {
      return { success: false, error: i18n.t('account.usernameTaken') };
    }
    const current = store.getState().auth.user;
    if (!current) return { success: false, error: i18n.t('errors.userNotFound') };
    const profileImage = input.profileImage
      ? await imageUploadService.uploadProfileImage(input.profileImage).catch(error => {
          logger.error('Onboarding profil fotoğrafı yüklenemedi:', error);
          return undefined;
        })
      : undefined;
    const user: User = {
      ...current,
      username: input.username.trim().toLowerCase(),
      bio: input.bio,
      interests: input.interests,
      ...(input.intent ? { intent: input.intent } : {}),
      ...(input.displayName ? { displayName: input.displayName } : {}),
      ...(profileImage ? { profileImage } : {}),
    };
    await setDoc(doc(getFirestore(), 'users', current.id), { ...user, updatedAt: serverTimestamp() }, { merge: true });
    await Promise.all([
      AsyncStorage.setItem('userData', JSON.stringify(user)),
      AsyncStorage.setItem('hasCompletedOnboarding', 'true'),
    ]);
    store.dispatch(patchAuth({ user, hasCompletedOnboarding: true }));
    return { success: true };
  } catch (error) {
    logger.error('Onboarding error:', error);
    return { success: false, error: i18n.t('account.onboardingFailed') };
  } finally {
    store.dispatch(patchAuth({ isLoading: false }));
  }
}
