import { Button, Callout, Text } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { usePushBanner } from '../hooks/usePushBanner';
import { pushPromptStyles as styles } from '../styles/pushPromptStyles';

/**
 * İzni kapalı kullanıcıya "Bildirimler kapalı" şeridi. Hiç sorulmamışsa
 * sistem penceresini açar; iOS'ta reddedilmişse Ayarlar'a götürür.
 */
export function PushPermissionBanner({ snoozable = false }: { snoozable?: boolean }) {
  const { t } = useTranslation();
  const banner = usePushBanner(snoozable);
  if (!banner.visible) return null;

  return (
    <Callout tone="info" icon="notifications-outline" title={t('pushPrompt.bannerTitle')} style={styles.banner}>
      <Text variant="caption" tone="textSecondary">{t('pushPrompt.bannerBody')}</Text>
      <View style={styles.bannerActions}>
        <Button
          label={t(banner.blocked ? 'pushPrompt.openSettings' : 'pushPrompt.enable')}
          variant="secondary"
          size="sm"
          onPress={banner.enable}
        />
        {banner.dismiss ? (
          <Button label={t('pushPrompt.later')} variant="ghost" size="sm" onPress={banner.dismiss} />
        ) : null}
      </View>
    </Callout>
  );
}
