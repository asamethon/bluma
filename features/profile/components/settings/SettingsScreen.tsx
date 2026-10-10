import { PageHeader, Screen, Switch, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { createSettingsStyles } from '@/features/profile/styles/settingsStyles';
import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { authActions } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { preferencesActions } from '@/store/preferencesStore';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { LanguageSettings } from './LanguageSettings';
import { SettingsRow } from './SettingsRow';
import { SettingsSection } from './SettingsSection';

/** Destek yazışmasında sürüm sorabilmek için gerçek binary sürümü; Expo Go'da manifest'e düşer. */
const APP_VERSION = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '-';
const VERSION_LABEL = Application.nativeBuildVersion
  ? `${APP_VERSION} (${Application.nativeBuildVersion})`
  : APP_VERSION;

export function SettingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createSettingsStyles(colors), [colors]);
  const matureEnabled = useAppSelector(state => state.preferences.showMatureContent);
  const isEmailAccount = useAppSelector(state => state.auth.user?.authProvider === 'email');

  useEffect(() => { void preferencesActions.load(); }, []);
  const signOut = useCallback(() => {
    Alert.alert(t('profileScreen.signOut'), t('profileScreen.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profileScreen.signOut'), style: 'destructive', onPress: () => {
        void authActions.signOut();
        router.replace('/');
      } },
    ]);
  }, [router, t]);
  const rateApp = useCallback(() => {
    void reviewPromptActions.openStoreListing().then(opened => {
      if (!opened) Alert.alert(t('common.error'), t('settings.rateUsFailed'));
    });
  }, [t]);
  const go = useCallback((route: string) => router.push(route as never), [router]);

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <PageHeader title={t('settings.title')} onBack={router.back} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SettingsSection title={t('settings.accountSection')}>
          <SettingsRow icon="person-circle-outline" label={t('profileScreen.editProfile')} color={colors.primary} onPress={() => go('/profile/edit')} />
          {isEmailAccount ? <SettingsRow icon="mail-outline" label={t('emailVerify.screenTitle')} color={colors.primary} onPress={() => go('/profile/verify-email')} /> : null}
          <SettingsRow icon="log-out-outline" label={t('profileScreen.signOut')} color={colors.error} noBorder onPress={signOut} />
        </SettingsSection>
        <SettingsSection title={t('notifications.title')}>
          <SettingsRow icon="notifications-outline" label={t('settings.notificationPrefs')} color={colors.primary} noBorder onPress={() => go('/profile/notification-settings')} />
        </SettingsSection>
        <LanguageSettings />
        <SettingsSection title={t('settings.contentSection')}>
          <View style={styles.matureRow}>
            <Ionicons name="warning-outline" size={20} color={colors.primary} />
            <View style={styles.matureCopy}>
              <Text variant="bodyStrong">{t('settings.matureContent')}</Text>
              <Text variant="caption" tone="textLight">{t('settings.matureContentSub')}</Text>
            </View>
            <Switch checked={matureEnabled} onChange={preferencesActions.setShowMatureContent} />
          </View>
        </SettingsSection>
        <SettingsSection title={t('settings.aboutSection')}>
          <SettingsRow icon="cloud-download-outline" label={t('profileScreen.offlineLibrary')} color={colors.primary} onPress={() => go('/profile/offline')} />
          <SettingsRow icon="help-circle-outline" label={t('help.title')} color={colors.primary} onPress={() => go('/help')} />
          <SettingsRow icon="star-outline" label={t('settings.rateUs')} color={colors.primary} onPress={rateApp} />
          <SettingsRow icon="information-circle-outline" label={t('settings.version')} color={colors.primary} noBorder right={<Text variant="label" tone="textLight">{VERSION_LABEL}</Text>} />
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}
