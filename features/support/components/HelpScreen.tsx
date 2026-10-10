import { PageHeader, Screen, SettingsGroup } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/constants/config';
import { useTheme } from '@/constants/theme';
import { openPrivacyPolicy, openTermsOfService } from '@/utils/legal';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView } from 'react-native';
import { useAccountDeletion } from '../hooks/useAccountDeletion';
import { createHelpStyles } from '../styles/helpStyles';
import { DeleteAccountModal } from './DeleteAccountModal';
import { FaqSection } from './FaqSection';
import { HelpLinkRow } from './HelpLinkRow';

export function HelpScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const deletion = useAccountDeletion();
  const styles = useMemo(() => createHelpStyles(colors), [colors]);
  const emailSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('help.supportSubject'))}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <PageHeader title={t('help.title')} onBack={router.back} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FaqSection />
        <SettingsGroup title={t('help.contactSection')}>
          <HelpLinkRow icon="mail-outline" label={t('help.emailSupport')} onPress={() => void emailSupport()} last />
        </SettingsGroup>
        <SettingsGroup title={t('help.legalSection')}>
          <HelpLinkRow icon="lock-closed-outline" label={t('legal.privacyPolicy')} onPress={openPrivacyPolicy} />
          <HelpLinkRow icon="document-text-outline" label={t('legal.terms')} onPress={openTermsOfService} last />
        </SettingsGroup>
        {deletion.user && (
          <SettingsGroup title={t('help.accountSection')}>
            <HelpLinkRow icon="trash-outline" label={t('help.deleteAccount')} onPress={deletion.request} danger last />
          </SettingsGroup>
        )}
      </ScrollView>
      <DeleteAccountModal
        visible={deletion.visible}
        password={deletion.password}
        deleting={deletion.deleting}
        onPassword={deletion.setPassword}
        onClose={deletion.close}
        onSubmit={deletion.submit}
      />
    </Screen>
  );
}
