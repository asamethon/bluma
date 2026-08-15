import { Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = { name?: string; compact?: boolean; pending?: boolean };

/** Gizli hesabın içeriği yerine gösterilen kilit kartı. */
export function PrivateProfileNotice({ name, compact, pending }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceVariant,
          borderColor: colors.border,
          paddingVertical: compact ? Spacing.lg : 36,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={pending ? 'time-outline' : 'lock-closed'} size={22} color={colors.primary} />
      </View>
      <Text variant="bodyStrong" style={{ marginTop: 12 }}>
        {t('privacy.privateProfileTitle')}
      </Text>
      <Text variant="caption" tone="textSecondary" style={styles.body}>
        {pending
          ? t('privacy.privateProfileRequested')
          : name
            ? t('privacy.privateProfileBody', { name })
            : t('privacy.privateProfileBodyGeneric')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginHorizontal: Spacing.screenX,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { marginTop: 6, textAlign: 'center' },
});
