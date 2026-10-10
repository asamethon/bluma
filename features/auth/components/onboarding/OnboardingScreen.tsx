import { Button, Screen, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useOnboardingForm } from '@/features/auth/hooks/useOnboardingForm';
import { ONBOARDING_STEPS } from '@/features/auth/onboarding/constants';
import { useAppSelector } from '@/store/hooks';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { onboardingStyles as styles } from '../../styles/onboardingStyles';
import { CompletionStep } from './CompletionStep';
import { GenresStep } from './GenresStep';
import { IntentStep } from './IntentStep';
import { OnboardingProgress } from './OnboardingProgress';
import { ProfileStep } from './ProfileStep';
import { AuthBackdrop } from '../AuthBackdrop';

export function OnboardingScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const authenticated = useAppSelector(state => state.auth.isAuthenticated);
  const completed = useAppSelector(state => state.auth.hasCompletedOnboarding);
  const form = useOnboardingForm();

  if (!authenticated) return <Redirect href="/(auth)/signin" />;
  if (completed) return <Redirect href={form.intent && form.intent !== 'reader' ? '/(tabs)/write' : '/'} />;

  const content = form.step === 0
    ? <IntentStep selected={form.intent} onSelect={form.selectIntent} />
    : form.step === 1
      ? <GenresStep selected={form.data.interests} onToggle={form.toggleGenre} />
      : form.step === 2
        ? (
          <ProfileStep
            avatar={form.avatar.image}
            displayName={form.data.displayName}
            username={form.data.username}
            status={form.usernameStatus}
            onAvatar={form.avatar.showOptions}
            onDisplayName={form.setDisplayName}
            onUsername={form.updateUsername}
          />
        )
        : <CompletionStep genres={form.data.interests} />;

  return (
    <Screen style={[styles.screen, { backgroundColor: colors.background }]}>
      <AuthBackdrop />
      <OnboardingProgress
        step={form.step}
        total={ONBOARDING_STEPS.length}
        completion={form.completion}
        onBack={form.back}
      />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {!form.completion && (
          <View style={styles.stepIntro}>
            <Text variant="title">
              {t(ONBOARDING_STEPS[form.step].title)}
            </Text>
            <Text variant="body" tone="textSecondary" style={styles.stepSubtitle}>
              {ONBOARDING_STEPS[form.step].sub ? t(ONBOARDING_STEPS[form.step].sub) : ''}
            </Text>
          </View>
        )}
        {content}
      </ScrollView>
      <View style={[
        styles.footer,
        { backgroundColor: colors.surface, borderTopColor: form.completion ? 'transparent' : colors.border },
      ]}>
        <Button
          label={form.completion
            ? form.loading ? t('onboarding.savingProgress') : t('onboarding.enterBluma')
            : t('common.continue')}
          variant="primary"
          size="lg"
          iconRight="arrow-forward"
          onPress={form.completion ? form.finish : form.next}
          disabled={form.loading || !form.canProceed}
        />
      </View>
    </Screen>
  );
}
