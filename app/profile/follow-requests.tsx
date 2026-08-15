import { Screen, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { FollowRequestRow } from '@/features/social/components/FollowRequestRow';
import { useFollowRequests } from '@/features/social/hooks/useFollowRequests';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function FollowRequestsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { requests, loading, approve, reject } = useFollowRequests();

  const openProfile = useCallback((userId: string) => router.push(`/user/${userId}` as any), [router]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof requests)[number] }) => (
      <FollowRequestRow
        request={item}
        onApprove={approve}
        onReject={reject}
        onPress={openProfile}
      />
    ),
    [approve, reject, openProfile]
  );

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="subheading">{t('followRequests.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlashList
          data={requests}
          keyExtractor={item => item.user.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="person-add-outline" size={32} color={colors.textLight} />
              <Text variant="body" tone="textSecondary" style={{ marginTop: 10, textAlign: 'center' }}>
                {t('followRequests.empty')}
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerIcon: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32 },
});
