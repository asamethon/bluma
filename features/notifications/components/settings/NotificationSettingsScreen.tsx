import { Callout, PageHeader, Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useNotificationSettings } from '@/features/notifications/hooks/useNotificationSettings';
import { createNotificationSettingsStyles } from '@/features/notifications/styles/notificationSettingsStyles';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { NotificationSettingsCard } from './NotificationSettingsCard';
import { ACTIVITY_ROWS, CHANNEL_ROWS } from './notificationRows';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createNotificationSettingsStyles(colors), [colors]);
  const { settings, toggle, pushOff } = useNotificationSettings();

  return (
    <Screen style={styles.container} edges={['top']}>
      <PageHeader title={t('notifications.title')} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <NotificationSettingsCard
          title={t('notifSettings.channels')}
          rows={CHANNEL_ROWS}
          settings={settings}
          disabled={false}
          onChange={toggle}
        />

        <NotificationSettingsCard
          title={t('notifSettings.activity')}
          rows={ACTIVITY_ROWS}
          settings={settings}
          disabled={pushOff}
          onChange={toggle}
        />

        {pushOff ? (
          <View style={styles.note}>
            <Callout tone="info">{t('notifSettings.enablePushFirst')}</Callout>
          </View>
        ) : null}

      </ScrollView>
    </Screen>
  );
}
