import { BloomMark, Button, IconButton, Screen, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { AuthDivider } from '@/features/auth/components/AuthDivider';
import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';
import { AuthLabeledInput } from '@/features/auth/components/AuthLabeledInput';
import { AuthSocialButtons } from '@/features/auth/components/AuthSocialButtons';
import { SignUpPasswordField } from '@/features/auth/components/SignUpPasswordField';
import { TermsAcceptance } from '@/features/auth/components/TermsAcceptance';
import { useSignUpForm } from '@/features/auth/hooks/useSignUpForm';
import { signUpStyles as s } from '@/features/auth/styles/signUpStyles';
import { useAppSelector } from '@/store/hooks';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const form = useSignUpForm();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const hasCompletedOnboarding = useAppSelector(state => state.auth.hasCompletedOnboarding);

  if (isAuthenticated && hasCompletedOnboarding) return <Redirect href="/" />;
  if (isAuthenticated && !hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthBackdrop />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[s.scrollContent, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconButton
            icon="arrow-back"
            size={40}
            iconSize={22}
            style={s.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.navigate('/(auth)/walkthrough')}
          />

          <View style={s.hero}>
            <View style={s.brandRow}>
              <BloomMark size={24} color={colors.primary} coreColor={colors.bloom} />
              <Text variant="overline" tone="primary">BLUMA</Text>
            </View>
            <Text variant="display">{t('auth.createAccountTitle')}</Text>
            <Text variant="body" tone="textSecondary" style={s.subtitle}>{t('auth.createAccountSub')}</Text>
          </View>

          <View style={s.form}>
            <AuthLabeledInput
              label={t('auth.fullNameLabel')}
              icon="person-outline"
              value={form.form.name}
              onChangeText={value => form.update('name', value)}
              placeholder={t('auth.fullNamePlaceholder')}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <AuthLabeledInput
              label={t('auth.emailLabel')}
              icon="mail-outline"
              value={form.form.email}
              onChangeText={value => form.update('email', value)}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <SignUpPasswordField
              value={form.form.password}
              strength={form.strength}
              visible={form.showPassword}
              onChange={value => form.update('password', value)}
              onToggleVisibility={form.togglePassword}
            />
            <TermsAcceptance accepted={form.agreed} onToggle={form.toggleAgreement} />
            <Button
              label={form.isLoading ? t('auth.creatingAccount') : t('common.continue')}
              variant="primary"
              size="lg"
              iconRight="arrow-forward"
              onPress={form.signUpWithEmail}
              disabled={!form.ready || form.isLoading}
              style={s.submit}
            />
            <AuthDivider label={t('auth.or')} />
            <AuthSocialButtons
              disabled={form.isLoading}
              onApplePress={form.signUpWithApple}
              onGooglePress={form.signUpWithGoogle}
            />
          </View>

          <View style={s.spacer} />
          <View style={s.footer}>
            <Text variant="body" tone="textSecondary">{t('guest.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
              <Text variant="bodyStrong" tone="primary">{t('guest.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
