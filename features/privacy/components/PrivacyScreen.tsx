import { Callout, ListRow, PageHeader, Screen, SettingsGroup, Switch, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { usePrivacySettings } from '@/features/privacy/hooks/usePrivacySettings';
import { createPrivacyStyles as createStyles } from '@/features/privacy/styles/privacyStyles';
import { PrivacySettings } from '@/features/privacy/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

const ROWS: { key: keyof PrivacySettings; icon: keyof typeof Ionicons.glyphMap; title: string; caption: string }[] = [
  { key: 'privateAccount', icon: 'lock-closed-outline', title: 'privacy.privateAccount', caption: 'privacy.privateAccountSub' },
  { key: 'showActivity', icon: 'pulse-outline', title: 'privacy.showActivity', caption: 'privacy.showActivitySub' },
  { key: 'allowMessages', icon: 'chatbubble-ellipses-outline', title: 'privacy.allowMessages', caption: 'privacy.allowMessagesSub' },
  { key: 'discoverable', icon: 'search-outline', title: 'privacy.discoverable', caption: 'privacy.discoverableSub' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, toggle, error, isGuest } = usePrivacySettings();

  return (
    <Screen style={styles.container} edges={['top']}>
      <PageHeader title={t('privacy.title')} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text variant="body" tone="textSecondary">{t('privacy.description')}</Text>
        </View>

        <SettingsGroup title={t('privacy.title')}>
          {ROWS.map((row, index) => (
            <ListRow
              key={row.key}
              icon={row.icon}
              title={t(row.title)}
              subtitle={t(row.caption)}
              disabled={isGuest}
              divider={index < ROWS.length - 1}
              right={
                <Switch checked={settings[row.key]} onChange={v => toggle(row.key, v)} disabled={isGuest} />
              }
            />
          ))}
        </SettingsGroup>

        <View style={styles.notes}>
          {error ? <Callout tone="error">{error}</Callout> : null}
          <Callout tone="neutral">{t('privacy.note')}</Callout>
        </View>
      </ScrollView>
    </Screen>
  );
}
