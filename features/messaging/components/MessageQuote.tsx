import { Text } from '@/components/ui';
import { Radius, Spacing, alpha, useTheme } from '@/constants/theme';
import type { MessageReply } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReplyVisibility } from '../hooks/useReplyVisibility';

const KIND_ICON = {
  image: 'image-outline',
  story: 'book-outline',
  viewOnce: 'flame-outline',
  voice: 'mic-outline',
  gif: 'film-outline',
  sticker: 'happy-outline',
  text: null,
} as const;

type Props = {
  threadId: string;
  reply: MessageReply;
  /** Alıntıyı taşıyan baloncuk bana mı ait — zemin ve metin ona göre tonlanır. */
  mine: boolean;
  authorName: string;
  onPress?: (messageId: string) => void;
};

/** Baloncuğun içindeki alıntı: ince şerit, yazar künyesi ve tek satır özet. */
export function MessageQuote({ threadId, reply, mine, authorName, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tint = mine ? colors.onPrimary : colors.primary;
  const icon = KIND_ICON[reply.kind];
  const visible = useReplyVisibility(threadId, reply.id);
  if (!visible) return null;

  return (
    <Pressable
      onPress={() => onPress?.(reply.id)}
      style={[
        styles.quote,
        { backgroundColor: mine ? alpha(colors.onPrimary, 0.16) : alpha(colors.primary, 0.08) },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: tint }]} />
      <View style={styles.body}>
        <Text variant="labelSm" color={tint} numberOfLines={1}>{authorName}</Text>
        <View style={styles.line}>
          {icon && <Ionicons name={icon} size={12} color={mine ? colors.onPrimary : colors.textSecondary} />}
          <Text
            variant="caption"
            color={mine ? alpha(colors.onPrimary, 0.85) : colors.textSecondary}
            numberOfLines={1}
            style={styles.snippet}
          >
            {reply.text || t('messages.photoPreview')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Alıntı, baloncuğun genişliğini BELİRLER: `flex: 1` verilirse baloncuk
  // altındaki kısa metne göre daralıp alıntıyı iki harfe düşürüyordu.
  quote: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.sm,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    minWidth: 150,
    maxWidth: 250,
  },
  bar: { width: 3, borderRadius: Radius.pill },
  body: { flexShrink: 1, gap: 1 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  snippet: { flexShrink: 1 },
});
