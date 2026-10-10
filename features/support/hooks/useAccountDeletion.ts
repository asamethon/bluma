import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { logger } from '@/utils/logger';
import { useCallback, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type State = { visible: boolean; password: string; deleting: boolean };
type Action =
  | { type: 'visible'; value: boolean }
  | { type: 'password'; value: string }
  | { type: 'deleting'; value: boolean }
  | { type: 'complete' };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'visible') return { ...state, visible: action.value };
  if (action.type === 'password') return { ...state, password: action.value };
  if (action.type === 'deleting') return { ...state, deleting: action.value };
  return { visible: false, password: '', deleting: false };
};

export function useAccountDeletion() {
  const { t } = useTranslation();
  const user = useAppSelector(state => state.auth.user);
  const [state, dispatch] = useReducer(reducer, { visible: false, password: '', deleting: false });
  const perform = useCallback(async (password?: string) => {
    dispatch({ type: 'deleting', value: true });
    try {
      const result = await authActions.deleteAccount(password);
      if (!result.success) return Alert.alert(t('common.error'), result.error || t('account.deleteFailed'));
      Alert.alert(t('help.accountDeletedTitle'), t('help.accountDeletedMessage'), [{ text: t('common.ok') }]);
      dispatch({ type: 'complete' });
    } catch (error) {
      logger.error('Delete account error:', error);
      Alert.alert(t('common.error'), t('account.deleteFailed'));
    } finally {
      dispatch({ type: 'deleting', value: false });
    }
  }, [t]);
  const request = useCallback(() => {
    if (!user) return Alert.alert(t('common.error'), t('errors.userNotFound'));
    if (user.authProvider === 'email') return dispatch({ type: 'visible', value: true });
    Alert.alert(t('help.deleteAccount'), t('help.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('help.deleteAccount'), style: 'destructive', onPress: () => void perform() },
    ]);
  }, [perform, t, user]);
  const submit = useCallback(() => {
    if (!state.password.trim()) return Alert.alert(t('common.error'), t('help.enterPassword'));
    void perform(state.password.trim());
  }, [perform, state.password, t]);

  return {
    ...state,
    user,
    close: () => dispatch({ type: 'visible', value: false }),
    request,
    setPassword: (value: string) => dispatch({ type: 'password', value }),
    submit,
  };
}
