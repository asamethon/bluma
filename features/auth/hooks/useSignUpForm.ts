import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { suggestEmailFix } from '../utils/emailTypos';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

type Field = 'name' | 'email' | 'password';
const strongPassword = (value: string) => value.length >= 8 && /[a-z]/i.test(value) && /[0-9]/.test(value);
const passwordStrength = (value: string) => Math.min(
  Number(value.length >= 6)
  + Number(value.length >= 10)
  + Number(/[0-9]/.test(value) && /[a-z]/i.test(value))
  + Number(/[^a-z0-9]/i.test(value)),
  4,
);

export function useSignUpForm() {
  const { t } = useTranslation();
  const isLoading = useAppSelector(state => state.auth.isLoading);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const update = useCallback((field: Field, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  }, []);

  const valid = !!form.name.trim() && /\S+@\S+/.test(form.email)
    && strongPassword(form.password) && agreed;

  const signUpWithEmail = useCallback(async () => {
    if (!form.name.trim()) return Alert.alert(t('common.error'), t('auth.enterName'));
    if (!form.email.includes('@')) return Alert.alert(t('common.error'), t('auth.enterValidEmail'));
    if (!strongPassword(form.password)) {
      return Alert.alert(t('common.error'), t('auth.passwordRequirements'));
    }
    if (!agreed) return Alert.alert(t('common.error'), t('auth.mustAcceptTerms'));

    const suggestion = suggestEmailFix(form.email);
    if (suggestion) {
      const shouldContinue = await new Promise<boolean>(resolve => {
        Alert.alert(t('emailVerify.typoTitle'), t('emailVerify.typoBody', { suggestion }), [
          { text: t('emailVerify.typoKeep'), style: 'cancel', onPress: () => resolve(true) },
          { text: t('emailVerify.typoUse'), onPress: () => { update('email', suggestion); resolve(false); } },
        ]);
      });
      if (!shouldContinue) return;
    }
    const result = await authActions.signUpWithEmail(form.email, form.password, form.name);
    if (!result.success) Alert.alert(t('common.error'), result.error || t('authErrors.signUpFailed'));
  }, [agreed, form, t, update]);

  const signUpWithGoogle = useCallback(async () => {
    if (isLoading) return;
    const result = await authActions.signInWithGoogle();
    if (!result.success) {
      Alert.alert(t('common.error'), result.error || t('authErrors.googleSignInFailed'));
    }
  }, [isLoading, t]);

  const signUpWithApple = useCallback(async () => {
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

  return {
    agreed,
    form,
    isLoading,
    ready: valid,
    showPassword,
    strength: passwordStrength(form.password),
    toggleAgreement: () => setAgreed(value => !value),
    togglePassword: () => setShowPassword(value => !value),
    update,
    signUpWithApple,
    signUpWithEmail,
    signUpWithGoogle,
  };
}
