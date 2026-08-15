import {
  Screen, Avatar, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { authActions, User } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { PrivateProfileNotice } from '@/features/privacy/components/PrivateProfileNotice';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

type Tab = 'followers' | 'following';

export default function FollowingScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAppSelector(s => s.auth.user);

  const [tab, setTab] = useState<Tab>('following');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  // Gizli hesabın takipçi/takip listeleri de yalnızca takipçilerine açıktır.
  const access = useProfileAccess(profileUser);

  useEffect(() => {
    if (id) { loadProfileUser(); loadBothLists(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProfileUser = async () => {
    try { const u = await authActions.getUserById(id); setProfileUser(u); } catch {}
  };

  const loadBothLists = async () => {
    try {
      setIsLoading(true);
      const firestore = await import('@react-native-firebase/firestore');
      const { collection, getDocs, getFirestore } = firestore;
      const db = getFirestore();

      const [followerSnap, followingSnap] = await Promise.all([
        getDocs(collection(db, 'users', id, 'followers')),
        getDocs(collection(db, 'users', id, 'following')),
      ]);

      const [followerResults, followingResults] = await Promise.all([
        Promise.all(followerSnap.docs.map(doc => authActions.getUserById(doc.id))),
        Promise.all(followingSnap.docs.map(doc => authActions.getUserById(doc.id))),
      ]);
      const followerList = followerResults.filter((u): u is User => !!u);
      const followingList = followingResults.filter((u): u is User => !!u);

      setFollowers(followerList);
      setFollowing(followingList);

      if (currentUser?.id) {
        const allUsers = [...new Set([...followerList.map(u => u.id), ...followingList.map(u => u.id)])]
          .filter(uid => uid !== currentUser.id);
        const statuses = await Promise.all(allUsers.map(uid => authActions.isFollowingUser(uid)));
        const statusMap: Record<string, boolean> = {};
        allUsers.forEach((uid, i) => { statusMap[uid] = statuses[i]; });
        setFollowingStatus(statusMap);
      }
    } catch {}
    finally { setIsLoading(false); }
  };

  const handleToggleFollow = async (userId: string) => {
    const isNowFollowing = followingStatus[userId];
    if (isNowFollowing) {
      const target = [...followers, ...following].find(u => u.id === userId);
      Alert.alert(t('social.unfollowTitle'), t('social.unfollowConfirm', { name: target?.displayName || t('social.thisUser') }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('social.unfollowTitle'), style: 'destructive', onPress: async () => {
          const r = await authActions.unfollowUser(userId);
          if (r.success) setFollowingStatus(p => ({ ...p, [userId]: false }));
        }},
      ]);
    } else {
      const r = await authActions.followUser(userId);
      // Gizli hesapta takip değil, onay bekleyen bir istek oluşur.
      if (r.success && !(r as any).pending) setFollowingStatus(p => ({ ...p, [userId]: true }));
      else if (r.success) Alert.alert(t('followRequests.title'), t('followRequests.sent'));
    }
  };

  const currentList = tab === 'followers' ? followers : following;
  const filteredList = searchQuery
    ? currentList.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentList;

  const renderUser = ({ item: user, index }: { item: User; index: number }) => {
    const isF = followingStatus[user.id] || false;
    const isMe = currentUser?.id === user.id;
    return (
      <View>
        <Pressable
          style={styles.userRow}
          onPress={() => router.push(`/user/${user.id}` as any)}
        >
          <Avatar uri={user.profileImage} name={user.displayName} size={50} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="subheading" numberOfLines={1} style={{ fontWeight: '700' }}>{user.displayName}</Text>
            <Text variant="caption" tone="primary">@{user.username || 'user'} · {t('social.followerCount', { count: user.followersCount || 0, formatted: fmtN(user.followersCount) })}</Text>
          </View>
          {!isMe && (
            <TouchableOpacity
              style={[styles.followBtn, isF
                ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }
                : { backgroundColor: colors.primary }
              ]}
              onPress={() => handleToggleFollow(user.id)}
            >
              <Text variant="label" color={isF ? colors.textSecondary : '#fff'}>
                {isF ? t('social.followingShortBtn') : t('social.follow')}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
        {index < filteredList.length - 1 && (
          <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 62 }]} />
        )}
      </View>
    );
  };

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text variant="subheading" style={{ fontWeight: '700' }}>{profileUser?.displayName || '…'}</Text>
          <Text variant="caption" tone="textLight">@{profileUser?.username || '…'}</Text>
        </View>
      </View>

      {access.locked || access.checking ? (
        access.locked ? (
          <View style={{ paddingTop: 32 }}>
            <PrivateProfileNotice name={profileUser?.displayName?.split(' ')[0]} />
          </View>
        ) : null
      ) : (
      <>
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(['followers', 'following'] as Tab[]).map(t2 => {
          const on = tab === t2;
          const count = t2 === 'followers' ? followers.length : following.length;
          return (
            <Pressable key={t2} style={styles.tabItem} onPress={() => setTab(t2)}>
              <Text
                variant="label"
                style={{ fontWeight: on ? '700' : '600', color: on ? colors.text : colors.textSecondary }}
              >
                {t2 === 'followers' ? t('social.followersTab') : t('social.followingTab')}{' '}
                <Text variant="label" style={{ color: on ? colors.primary : colors.textSecondary }}>
                  {fmtN(count)}
                </Text>
              </Text>
              {on && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
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
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlashList
          data={filteredList}
          renderItem={renderUser}
          keyExtractor={u => u.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.screenX, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="people-outline" size={38} color={colors.textSecondary} />
              <Text variant="body" tone="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
                {searchQuery ? t('social.noMatch') : tab === 'followers' ? t('social.noFollowers') : t('social.noFollowing')}
              </Text>
            </View>
          }
        />
      )}
      </>
      )}
    </Screen>
  );
}

function fmtN(n?: number) {
  const v = n || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}${i18n.t('common.thousandSuffix')}` : `${v}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.screenX,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 14,
    position: 'relative',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 2.5,
    borderRadius: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.screenX,
    marginVertical: 14,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    paddingVertical: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  followBtn: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
