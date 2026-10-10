import { Text } from '@/components/ui';
import { Motion, Radius, Spacing, alpha, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  mine: boolean;
  opened: boolean;
  /** Yalnızca alıcı ve yalnızca bir kez açabilir. */
  canOpen: boolean;
  onOpen: () => void;
};

/**
 * Tek seferlik fotoğrafın baloncuğu. Görsel burada HİÇ çizilmez: alıcı
 * dokununca tam ekran açılır ve aynı anda "açıldı" damgası düşer; gönderen
 * de kendi gönderdiğini yeniden açamaz (WhatsApp davranışı).
 */
export function ViewOnceContent({ mine, opened, canOpen, onOpen }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tint = mine ? colors.onPrimary : colors.primary;
  const muted = mine ? alpha(colors.onPrimary, 0.75) : colors.textSecondary;
  const label = opened
    ? t('messages.viewOnceOpened')
    : canOpen ? t('messages.viewOnceTapToOpen') : t('messages.viewOncePreview');

  return (
    <Pressable
      disabled={!canOpen}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, { opacity: pressed ? Motion.pressOpacity : 1 }]}
    >
      <View style={[styles.icon, { borderColor: alpha(tint, 0.5) }]}>
        <Ionicons name={opened ? 'checkmark' : 'flame'} size={16} color={tint} />
      </View>
      <View style={styles.copy}>
        <Text variant="bodyStrong" color={mine ? colors.onPrimary : colors.text}>
          {t('messages.viewOnceTitle')}
        </Text>
        <Text variant="caption" color={muted}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingRight: Spacing.sm, minWidth: 190 },
  icon: {
    width: 34, height: 34,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
});
