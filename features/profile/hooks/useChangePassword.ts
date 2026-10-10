import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { useCallback, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type State = { confirm: string; current: string; next: string; saving: boolean; visible: boolean };
const initialState: State = { confirm: '', current: '', next: '', saving: false, visible: false };
const reducer = (state: State, patch: Partial<State>): State => ({ ...state, ...patch });

export function useChangePassword() {
  const { t } = useTranslation();
  const router = useRouter();
  const email = useAppSelector(state => state.auth.user?.email);
  const provider = useAppSelector(state => state.auth.user?.authProvider);
  const [state, patch] = useReducer(reducer, initialState);
  const setCurrent = useCallback((current: string) => patch({ current }), []);
  const setNext = useCallback((next: string) => patch({ next }), []);
  const setConfirm = useCallback((confirm: string) => patch({ confirm }), []);
  const toggleVisible = useCallback(() => patch({ visible: !state.visible }), [state.visible]);
  const save = useCallback(() => {
    const invalid = !state.current || !state.next || !state.confirm;
    if (invalid) Alert.alert(t('changePassword.missingTitle'), t('changePassword.missingMessage'));
    else if (state.next.length < 6) Alert.alert(t('changePassword.weakTitle'), t('changePassword.weakMessage'));
    else if (state.next !== state.confirm) Alert.alert(t('changePassword.mismatchTitle'), t('changePassword.mismatchMessage'));
    else if (state.next === state.current) Alert.alert(t('changePassword.sameTitle'), t('changePassword.sameMessage'));
    else {
      patch({ saving: true });
      void authActions.changePassword(state.current, state.next).then(result => {
        if (result.success) {
          Alert.alert(t('common.success'), t('changePassword.updated'), [{ text: t('common.ok'), onPress: router.back }]);
        } else Alert.alert(t('common.error'), result.error || t('authErrors.changePasswordFailed'));
      }).finally(() => patch({ saving: false }));
    }
  }, [router, state, t]);
  const sendReset = useCallback(() => {
    if (!email) return;
    void authActions.resetPassword(email).then(result => {
      if (result.success) Alert.alert(t('changePassword.emailSentTitle'), t('changePassword.emailSentMessage', { email }));
      else Alert.alert(t('common.error'), result.error || t('changePassword.emailFailed'));
    });
  }, [email, t]);
  return {
    ...state,
    email,
    isEmailAccount: provider === 'email',
    provider,
    save,
    sendReset,
    setConfirm,
    setCurrent,
    setNext,
    toggleVisible,
  };
}
