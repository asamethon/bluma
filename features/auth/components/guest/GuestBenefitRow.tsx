import { Divider, Text } from '@/components/ui';
import { guestStateStyles as styles } from '@/features/auth/styles/guestStateStyles';
import { alpha, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { GUEST_CONTENT } from './guestContent';

type Row = (typeof GUEST_CONTENT)['library']['rows'][number];

export const GuestBenefitRow = memo(function GuestBenefitRow({ icon, label }: Row) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: alpha(colors.primary, 0.11) }]}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        <Text variant="bodyStrong" style={{ flex: 1 }}>{t(label)}</Text>
      </View>
      <Divider inset={46} />
    </View>
  );
});
