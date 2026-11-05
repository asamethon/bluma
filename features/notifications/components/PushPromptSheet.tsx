import { Button, Sheet, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { usePushPermissionWatcher } from '../hooks/usePushPermissionWatcher';
import { answerPushPrompt, finishPushPrompt } from '../services/pushPermission';
import { pushPromptStyles as styles } from '../styles/pushPromptStyles';

const decline = () => answerPushPrompt(false);
const accept = () => answerPushPrompt(true);

/**
 * Sistem izni penceresinden ÖNCE gelen kendi kartımız. "Şimdi değil" sistem
 * hakkını yakmaz (iOS pencereyi yalnızca bir kez gösterir); "Aç" denince
 * pencere, kart tamamen kapandıktan sonra açılır. Kökte bir kez kurulur.
 */
export function PushPromptSheet() {
  usePushPermissionWatcher();
  const prompt = useAppSelector(state => state.notification.pushPrompt);
  const blocked = useAppSelector(state => state.notification.pushPermission === 'blocked');
  const { colors } = useTheme();
  const { t } = useTranslation();
  const reason = prompt?.reason ?? 'follow';

  return (
    <Sheet visible={!!prompt?.open} onClose={decline} onClosed={finishPushPrompt}>
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="notifications-outline" size={30} color={colors.primary} />
        </View>
        <Text variant="title" style={styles.title}>{t(`pushPrompt.${reason}Title`)}</Text>
        <Text variant="body" tone="textSecondary" style={styles.sub}>
          {t(blocked ? 'pushPrompt.blockedHint' : `pushPrompt.${reason}Sub`)}
        </Text>
        <Button
          label={t(blocked ? 'pushPrompt.openSettings' : 'pushPrompt.enable')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={accept}
        />
        <TouchableOpacity onPress={decline} style={styles.skip}>
          <Text variant="label" tone="textLight">{t('pushPrompt.later')}</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
