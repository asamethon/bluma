import { normalizeUsername } from '@/features/auth/utils/usernameNormalize';
import { trackNudgeChanged } from '../services/usernameNudgeEvents';
import { assessUsername } from '../utils/usernameAssess';
import { imageUploadService } from '@/services/imageUploadService';
import { authActions } from '@/store/authStore';
import type { User } from '@/types';
import { logger } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useAvatarPicker, useProfileCoverPicker } from './useAvatarPicker';

export type EditProfileField = 'displayName' | 'username' | 'bio' | 'website' | 'location';
export type UsernameStatus = 'checking' | 'available' | 'taken' | null;
type Form = Record<EditProfileField, string>;
type State = { form: Form; saving: boolean; usernameStatus: UsernameStatus };
type Action =
  | { type: 'field'; field: EditProfileField; value: string; status?: UsernameStatus }
  | { type: 'usernameStatus'; username: string; status: UsernameStatus }
  | { type: 'saving'; value: boolean };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'saving') return { ...state, saving: action.value };
  if (action.type === 'usernameStatus') {
    return state.form.username === action.username ? { ...state, usernameStatus: action.status } : state;
  }
  return {
    ...state,
    form: { ...state.form, [action.field]: action.value },
    usernameStatus: action.field === 'username' ? action.status ?? null : state.usernameStatus,
  };
};

export function useEditProfileForm(user: User) {
  const { t } = useTranslation();
  const router = useRouter();
  // Öneri kartındaki çip bu rotayı adı önceden doldurarak açar.
  const params = useLocalSearchParams<{ username?: string }>();
  const prefill = normalizeUsername(params.username ?? '');
  const prefilled = !!prefill && prefill !== user.username;
  const avatar = useAvatarPicker(user.profileImage || null);
  const cover = useProfileCoverPicker(user.coverImage || null);
  const [state, dispatch] = useReducer(reducer, {
    saving: false,
    // Ön doldurulan ad daha doğrulanmadı; alan ilk render'dan itibaren "bakılıyor".
    usernameStatus: prefilled ? 'checking' : null,
    form: {
      displayName: user.displayName || '',
      username: prefilled ? prefill : user.username || '',
      bio: user.bio || '',
      website: user.website || '',
      location: user.location || '',
    },
  });

  const askAvailability = useCallback((username: string) => {
    void authActions.checkUsernameAvailability(username)
      .then(available => dispatch({ type: 'usernameStatus', username, status: available ? 'available' : 'taken' }))
      .catch(() => dispatch({ type: 'usernameStatus', username, status: 'taken' }));
  }, []);

  const update = useCallback((field: EditProfileField, value: string) => {
    if (field !== 'username') return dispatch({ type: 'field', field, value });
    const username = normalizeUsername(value);
    const status = username !== user.username && username.length >= 3 ? 'checking' : null;
    dispatch({ type: 'field', field, value: username, status });
    if (status) askAvailability(username);
  }, [askAvailability, user.username]);

  // Değer başlangıç durumundan geliyor; burada yalnızca müsaitlik bir kez sorulur.
  useEffect(() => {
    if (prefilled) askAvailability(prefill);
  }, [askAvailability, prefill, prefilled]);

  const save = useCallback(async () => {
    if (!state.form.displayName.trim() || !state.form.username.trim()) {
      return Alert.alert(t('common.error'), t('editProfile.nameUsernameRequired'));
    }
    if (state.form.username !== user.username && state.usernameStatus !== 'available') {
      return Alert.alert(t('common.error'), t('editProfile.pickAvailableUsername'));
    }
    const website = state.form.website.trim();
    if (website) {
      const isValid = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i.test(website);
      if (!isValid) {
        return Alert.alert(t('common.error'), t('editProfile.invalidWebsite'));
      }
    }
    dispatch({ type: 'saving', value: true });
    try {
      const profileUpload = avatar.image === user.profileImage
        ? Promise.resolve(user.profileImage)
        : avatar.image
          ? imageUploadService.uploadProfileImage(avatar.image)
          : Promise.resolve(undefined);
      const sameCover = (cover.image ?? null) === (user.coverImage ?? null);
      const coverUpload = sameCover
        ? Promise.resolve(user.coverImage ?? null)
        : cover.image
          ? imageUploadService.uploadProfileCover(cover.image)
          : Promise.resolve(null);
      const [profileImage, coverImage] = await Promise.all([profileUpload, coverUpload]);
      const username = normalizeUsername(state.form.username);
      await authActions.updateUserProfile({
        ...user,
        displayName: state.form.displayName.trim(),
        username,
        bio: state.form.bio.trim(),
        website: state.form.website.trim(),
        location: state.form.location.trim(),
        profileImage,
        coverImage,
      });
      // Sonucu ölç: eski ad işaretlenmişlerden biriyse ve gerçekten değiştiyse.
      const previous = assessUsername(user.username ?? '', user.displayName ?? '');
      if (previous.reason && username !== user.username) trackNudgeChanged(previous.reason);
      Alert.alert(t('common.success'), t('editProfile.updated'), [
        { text: t('common.ok'), onPress: () => router.push('/(tabs)/profile') },
      ]);
    } catch (error) {
      logger.error('Profile update error:', error);
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('account.profileUpdateFailed'));
    } finally {
      dispatch({ type: 'saving', value: false });
    }
  }, [avatar.image, cover.image, router, state.form, state.usernameStatus, t, user]);

  return { ...state, avatar, cover, save, update };
}
