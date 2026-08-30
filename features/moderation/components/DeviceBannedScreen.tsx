import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { SUPPORT_EMAIL } from '@/constants/config';

/** Banlı cihazda uygulamanın tamamının yerine gösterilen ekran. */
export function DeviceBannedScreen({ reason }: { reason?: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="ban-outline" size={56} color={colors.error} />
      <Text variant="title" style={styles.title}>{t('deviceBan.title')}</Text>
      <Text variant="body" tone="textSecondary" style={styles.body}>
        {reason || t('deviceBan.body')}
      </Text>
      <Text variant="caption" tone="textLight" style={styles.body}>
        {t('deviceBan.contact', { email: SUPPORT_EMAIL })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center' },
});
