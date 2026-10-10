import { Divider, Sheet, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { formatMessageStamp, toMillis } from '@/features/messaging/utils/time';
import type { DirectMessage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = {
  message: DirectMessage | null;
  deliveredUntil: number;
  readUntil: number;
  onClose: () => void;
};

/**
 * "Mesaj bilgisi": gönderim, iletim ve okunma zamanları.
 *
 * İletim/okunma damgaları mesaj başına değil thread üzerinde tutulur (her DM
 * için ek yazma olmasın diye); gösterilen saat, o mesajı kapsayan EN SON
 * filigranın saatidir — tiklerin dayandığı bilgi ile birebir aynı.
 */
export function MessageInfoSheet({ message, deliveredUntil, readUntil, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sentAt = message ? toMillis(message.createdAt) : 0;

  const rows = [
    {
      key: 'sent',
      icon: 'checkmark' as const,
      label: t('messages.infoSent'),
      value: message ? formatMessageStamp(message.createdAt) : '',
      color: colors.textSecondary,
    },
    {
      key: 'delivered',
      icon: 'checkmark-done' as const,
      label: t('messages.infoDelivered'),
      value: sentAt && deliveredUntil >= sentAt ? formatMessageStamp(new Date(deliveredUntil)) : null,
      color: colors.textSecondary,
    },
    {
      key: 'read',
      icon: 'checkmark-done' as const,
      label: t('messages.infoRead'),
      value: sentAt && readUntil >= sentAt ? formatMessageStamp(new Date(readUntil)) : null,
      color: colors.readTick,
    },
  ];

  return (
    <Sheet visible={!!message} onClose={onClose} title={t('messages.info')}>
      <View style={styles.body}>
        {rows.map((row, index) => (
          <View key={row.key}>
            {index > 0 && <Divider />}
            <View style={styles.row}>
              <Ionicons name={row.icon} size={18} color={row.value ? row.color : colors.textLight} />
              <Text variant="bodyStrong" style={styles.label}>{row.label}</Text>
              <Text variant="caption" tone={row.value ? 'textSecondary' : 'textLight'}>
                {row.value ?? t('messages.infoPending')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  label: { flex: 1 },
});
