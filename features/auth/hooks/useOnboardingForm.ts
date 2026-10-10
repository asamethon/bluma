import { useAvatarPicker } from '@/features/profile/hooks/useAvatarPicker';
import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { useCallback, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { ONBOARDING_STEPS, type OnboardingGenre, type OnboardingIntent } from '../onboarding/constants';

export type OnboardingUsernameStatus = 'checking' | 'available' | 'taken' | null;
type Data = { username: string; displayName: string; interests: OnboardingGenre[]; bio: string };
type State = { step: number; intent: OnboardingIntent | null; data: Data; usernameStatus: OnboardingUsernameStatus };
type Action =
  | { type: 'step'; delta: number }
  | { type: 'intent'; value: OnboardingIntent }
  | { type: 'genre'; value: OnboardingGenre }
  | { type: 'field'; field: 'displayName' | 'username'; value: string; status?: OnboardingUsernameStatus }
  | { type: 'usernameStatus'; username: string; status: OnboardingUsernameStatus };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'step') return { ...state, step: Math.max(0, Math.min(state.step + action.delta, ONBOARDING_STEPS.length - 1)) };
  if (action.type === 'intent') return { ...state, intent: action.value };
  if (action.type === 'genre') {
    const selected = state.data.interests.includes(action.value);
    return {
      ...state,
      data: { ...state.data, interests: selected ? state.data.interests.filter(item => item !== action.value) : [...state.data.interests, action.value] },
    };
  }
  if (action.type === 'usernameStatus') {
    return state.data.username === action.username ? { ...state, usernameStatus: action.status } : state;
  }
  return {
    ...state,
    data: { ...state.data, [action.field]: action.value },
    usernameStatus: action.field === 'username' ? action.status ?? null : state.usernameStatus,
  };
};

export function useOnboardingForm() {
  const { t } = useTranslation();
  const loading = useAppSelector(state => state.auth.isLoading);
  const avatar = useAvatarPicker();
  const [state, dispatch] = useReducer(reducer, {
    step: 0,
    intent: null,
    usernameStatus: null,
    data: { username: '', displayName: '', interests: [], bio: '' },
  });
  const updateUsername = useCallback((raw: string) => {
    const username = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const status = username.length >= 3 ? 'checking' : null;
    dispatch({ type: 'field', field: 'username', value: username, status });
    if (status) {
      void authActions.checkUsernameAvailability(username)
        .then(available => dispatch({ type: 'usernameStatus', username, status: available ? 'available' : 'taken' }))
        .catch(() => dispatch({ type: 'usernameStatus', username, status: 'taken' }));
    }
  }, []);
  const finish = useCallback(async () => {
    const result = await authActions.completeOnboarding({
      ...state.data,
      displayName: state.data.displayName || undefined,
      profileImage: avatar.image,
      intent: state.intent || 'both',
    });
    if (!result?.success) Alert.alert(t('common.error'), result?.error || t('account.onboardingFailed'));
  }, [avatar.image, state.data, state.intent, t]);
  const canProceed = state.step === 0
    ? !!state.intent
    : state.step === 1
      ? state.data.interests.length >= 3
      : state.step === 2
        ? state.data.username.length >= 3 && state.usernameStatus === 'available'
        : true;

  return {
    ...state,
    avatar,
    canProceed,
    completion: state.step === ONBOARDING_STEPS.length - 1,
    finish,
    loading,
    back: () => dispatch({ type: 'step', delta: -1 }),
    next: () => dispatch({ type: 'step', delta: 1 }),
    selectIntent: (value: OnboardingIntent) => dispatch({ type: 'intent', value }),
    setDisplayName: (value: string) => dispatch({ type: 'field', field: 'displayName', value }),
    toggleGenre: (value: OnboardingGenre) => dispatch({ type: 'genre', value }),
    updateUsername,
  };
}
