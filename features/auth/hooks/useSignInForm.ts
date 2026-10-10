import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

export function useSignInForm() {
  const { t } = useTranslation();
  const isLoading = useAppSelector(state => state.auth.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const signInWithEmail = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillEmailPassword'));
      return;
    }
    const result = await authActions.signInWithEmail(email, password);
    if (!result.success) Alert.alert(t('common.error'), result.error || t('authErrors.signInFailed'));
  }, [email, password, t]);

  const signInWithGoogle = useCallback(async () => {
    if (isLoading) return;
    const result = await authActions.signInWithGoogle();
    if (!result.success) {
      Alert.alert(t('common.error'), result.error || t('authErrors.googleSignInFailed'));
    }
  }, [isLoading, t]);

  const signInWithApple = useCallback(async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const result = await authActions.signInWithApple(credential);
      if (!result.success) {
        Alert.alert(t('common.error'), result.error || t('authErrors.appleSignInFailed'));
      }
    } catch (error: unknown) {
      const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;
      if (code !== 'ERR_CANCELED') Alert.alert(t('common.error'), t('authErrors.appleSignInFailed'));
    }
  }, [t]);

  const resetPassword = useCallback(() => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert(t('common.error'), t(email.trim() ? 'auth.enterValidEmail' : 'auth.enterEmailFirst'));
      return;
    }
    Alert.alert(t('auth.resetPasswordTitle'), t('auth.resetPasswordConfirm', { email }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('messages.send'),
        onPress: () => {
          void authActions.resetPassword(email.trim()).then(result => {
            Alert.alert(
              t(result.success ? 'common.success' : 'common.error'),
              result.success ? t('auth.resetEmailSent') : result.error || t('authErrors.resetFailed'),
            );
          });
        },
      },
    ]);
  }, [email, t]);

  return {
    email,
    isLoading,
    password,
    showPassword,
    setEmail,
    setPassword,
    togglePassword: () => setShowPassword(value => !value),
    resetPassword,
    signInWithApple,
    signInWithEmail,
    signInWithGoogle,
  };
}
