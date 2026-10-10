import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { ChatStyles } from '@/features/messaging/styles/chatStyles';
import { formatVoiceDuration } from '@/features/messaging/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Props = { durationMs: number; styles: ChatStyles; onCancel: () => void; onSend: () => void };

/** Kayıt sürerken bestecinin yerini alan şerit: vazgeç, sayaç, gönder. */
export function VoiceRecordingBar({ durationMs, styles, onCancel, onSend }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.composer}>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        style={[styles.roundButton, { backgroundColor: colors.surfaceVariant }]}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </Pressable>
      <View style={styles.recordingShell}>
        <View style={styles.recordingDot} />
        <Text variant="label">{formatVoiceDuration(durationMs)}</Text>
        <Text variant="caption" tone="textLight" style={styles.recordingHint} numberOfLines={1}>
          {t('messages.recording')}
        </Text>
      </View>
      <Pressable
        onPress={onSend}
        accessibilityRole="button"
        accessibilityLabel={t('messages.send')}
        style={[styles.roundButton, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="arrow-up" size={19} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}
