import { Button, EmptyState, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { notificationStyles as styles } from '../styles/notificationStyles';

export function NotificationEmptyState() {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="notifications-off-outline"
      title={t('notifications.emptyTitle')}
      description={t('notifications.emptySub')}
    />
  );
}

export function NotificationGuestState() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { startAuth } = useGuestGate();

  return (
    <View style={styles.guest}>
      <EmptyState
        icon="notifications-outline"
        title={t('notifications.guestTitle')}
        description={t('notifications.guestSub')}
      />
      <Button
        label={t('walkthrough.createAccount')}
        variant="primary"
        size="lg"
        iconRight="arrow-forward"
        onPress={() => startAuth('signup')}
        style={{ alignSelf: 'center' }}
      />
      <Pressable style={styles.guestLogin} onPress={() => startAuth('login')}>
        <Text variant="label" color={colors.primary}>
          {t('guest.alreadyHaveAccount')} {t('guest.signIn')}
        </Text>
      </Pressable>
    </View>
  );
}
