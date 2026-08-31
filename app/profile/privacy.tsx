import { IconButton, Screen, Switch, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { usePrivacySettings } from '@/features/privacy/hooks/usePrivacySettings';
import { PrivacySettings } from '@/features/privacy/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

const ROWS: { key: keyof PrivacySettings; icon: keyof typeof Ionicons.glyphMap; title: string; caption: string }[] = [
  { key: 'privateAccount', icon: 'lock-closed-outline', title: 'privacy.privateAccount', caption: 'privacy.privateAccountSub' },
  { key: 'showActivity', icon: 'pulse-outline', title: 'privacy.showActivity', caption: 'privacy.showActivitySub' },
  { key: 'allowMessages', icon: 'chatbubble-ellipses-outline', title: 'privacy.allowMessages', caption: 'privacy.allowMessagesSub' },
  { key: 'discoverable', icon: 'search-outline', title: 'privacy.discoverable', caption: 'privacy.discoverableSub' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, toggle, error, isGuest } = usePrivacySettings();

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" iconSize={24} glass onPress={() => router.back()} />
        <Text variant="subheading">{t('privacy.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="body" tone="textSecondary" style={{ marginBottom: Spacing.lg }}>
          {t('privacy.description')}
        </Text>

        <View style={styles.card}>
          {ROWS.map((row, i) => (
            <React.Fragment key={row.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={row.icon} size={19} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{t(row.title)}</Text>
                  <Text variant="caption" tone="textLight">{t(row.caption)}</Text>
                </View>
                <Switch
                  checked={settings[row.key]}
                  onChange={v => toggle(row.key, v)}
                  disabled={isGuest}
                />
              </View>
            </React.Fragment>
          ))}
        </View>

        {error && (
          <View style={[styles.note, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text variant="caption" color={colors.error} style={{ flex: 1 }}>
              {error}
            </Text>
          </View>
        )}

        <View style={[styles.note, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text variant="caption" tone="textSecondary" style={{ flex: 1 }}>
            {t('privacy.note')}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: Spacing.lg },
    note: {
      flexDirection: 'row',
      gap: Spacing.sm,
      alignItems: 'flex-start',
      padding: Spacing.lg,
      borderRadius: Radius.md,
      marginTop: Spacing.lg,
    },
  });
