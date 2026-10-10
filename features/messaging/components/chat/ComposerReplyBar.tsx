import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { ChatStyles } from '@/features/messaging/styles/chatStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Props = {
  /** Yanıtta alıntı, düzenlemede özgün metin. */
  text: string;
  /** "… kişisine yanıt" ya da "Mesajı düzenle". */
  label: string;
  styles: ChatStyles;
  onCancel: () => void;
};

/** Besteci künyesi: neye cevap verildiği ya da neyin düzenlendiği görünür durur. */
export function ComposerReplyBar({ text, label, styles, onCancel }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.replyBar}>
      <View style={styles.replyAccent} />
      <View style={styles.replyBody}>
        <Text variant="labelSm" tone="primary" numberOfLines={1}>{label}</Text>
        <Text variant="caption" tone="textSecondary" numberOfLines={1}>
          {text || t('messages.photoPreview')}
        </Text>
      </View>
      <Pressable onPress={onCancel} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
        <Ionicons name="close" size={18} color={colors.textLight} />
      </Pressable>
    </View>
  );
}
