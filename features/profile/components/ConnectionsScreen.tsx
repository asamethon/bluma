import { EmptyState, PageHeader, Screen, Skeleton, Text } from '@/components/ui';
import { PrivateProfileNotice } from '@/features/privacy/components/PrivateProfileNotice';
import type { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/constants/theme';
import { useConnections, type ConnectionTab } from '../hooks/useConnections';
import { connectionsStyles as styles } from '../styles/connectionsStyles';
import { ConnectionRow } from './ConnectionRow';

type Props = { profileId: string; initialTab: ConnectionTab };

function compactNumber(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}B` : `${value}`;
}

export function ConnectionsScreen({ profileId, initialTab }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const model = useConnections(profileId, initialTab);

  const openUser = useCallback(
    (userId: string) => router.push(`/user/${userId}`),
    [router],
  );

  const toggleFollow = useCallback((user: User) => {
    if (!model.followingById[user.id]) {
      void model.follow(user.id).then(result => {
        if (result.pending) Alert.alert(t('followRequests.title'), t('followRequests.sent'));
      });
      return;
    }

    Alert.alert(
      t('social.unfollowTitle'),
      t('social.unfollowConfirm', { name: user.displayName || t('social.thisUser') }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('social.unfollowTitle'),
          style: 'destructive',
          onPress: () => { void model.unfollow(user.id); },
        },
      ],
    );
  }, [model, t]);

  const renderUser = useCallback(
    ({ item, index }: { item: User; index: number }) => (
      <ConnectionRow
        user={item}
        following={model.followingById[item.id] ?? false}
        isCurrentUser={model.currentUserId === item.id}
        showDivider={index < model.visibleUsers.length - 1}
        onOpen={openUser}
        onToggleFollow={toggleFollow}
      />
    ),
    [model.currentUserId, model.followingById, model.visibleUsers.length, openUser, toggleFollow],
  );

  const empty = (
    <View style={styles.empty}>
      <EmptyState
        icon="people-outline"
        title={model.query
          ? t('social.noMatch')
          : model.tab === 'followers' ? t('social.noFollowers') : t('social.noFollowing')}
        compact
      />
    </View>
  );

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <PageHeader
        title={model.profileUser?.displayName || '…'}
        subtitle={`@${model.profileUser?.username || '…'}`}
        onBack={router.back}
      />

      {model.access.locked ? (
        <View style={styles.locked}>
          <PrivateProfileNotice name={model.profileUser?.displayName?.split(' ')[0]} />
        </View>
      ) : !model.access.checking && (
        <>
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            {(['followers', 'following'] as const).map(tab => {
              const active = model.tab === tab;
              const count = tab === 'followers' ? model.followers.length : model.following.length;
              return (
                <Pressable key={tab} style={styles.tabItem} onPress={() => model.setTab(tab)}>
                  <Text variant="label" color={active ? colors.text : colors.textSecondary}>
                    {t(tab === 'followers' ? 'social.followersTab' : 'social.followingTab')}{' '}
                    <Text variant="label" color={active ? colors.primary : colors.textSecondary}>
                      {compactNumber(count)}
                    </Text>
                  </Text>
                  {active && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.searchRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Ionicons name="search" size={17} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('social.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={model.query}
              onChangeText={model.setQuery}
            />
          </View>

          {model.isLoading ? (
            <View style={styles.loading}>
              {[0, 1, 2, 3].map(row => (
                <View key={row} style={styles.loadingRow}>
                  <Skeleton width={50} height={50} radius={25} />
                  <View style={styles.loadingCopy}>
                    <Skeleton width="55%" height={14} />
                    <Skeleton width="35%" height={11} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <FlashList
              // Sekme değişince liste sıfırdan kurulur: aynı örnek iki farklı
              // veri kümesi için geri dönüştürülünce kaydırma konumu ve düzen
              // önbelleği bayat kalıyor, listenin başında boşluk oluşuyordu.
              key={model.tab}
              data={model.visibleUsers}
              renderItem={renderUser}
              keyExtractor={user => user.id}
              maintainVisibleContentPosition={{ disabled: true }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={empty}
            />
          )}
        </>
      )}
    </Screen>
  );
}
