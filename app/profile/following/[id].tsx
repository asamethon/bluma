// Following screen — tab defaults to "following"; aynı component, farklı başlangıç tab'ı
import {
  Screen, Avatar, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { authActions, User } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Tab = 'followers' | 'following';

export default function FollowingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAppSelector(s => s.auth);

  const [tab, setTab] = useState<Tab>('following');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) { loadProfileUser(); loadBothLists(); }
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

      const followerList: User[] = [];
      for (const doc of followerSnap.docs) {
        const u = await authActions.getUserById(doc.id);
        if (u) followerList.push(u);
      }

      const followingList: User[] = [];
      for (const doc of followingSnap.docs) {
        const u = await authActions.getUserById(doc.id);
        if (u) followingList.push(u);
      }

      setFollowers(followerList);
      setFollowing(followingList);

      if (currentUser?.id) {
        const allUsers = [...new Set([...followerList.map(u => u.id), ...followingList.map(u => u.id)])];
        const statusMap: Record<string, boolean> = {};
        for (const uid of allUsers) {
          if (uid !== currentUser.id) {
            statusMap[uid] = await authActions.isFollowingUser(uid);
          }
        }
        setFollowingStatus(statusMap);
      }
    } catch {}
    finally { setIsLoading(false); }
  };

  const handleToggleFollow = async (userId: string) => {
    const isNowFollowing = followingStatus[userId];
    if (isNowFollowing) {
      const target = [...followers, ...following].find(u => u.id === userId);
      Alert.alert('Takipten Çık', `${target?.displayName || 'Bu kullanıcı'} adlı kullanıcıyı takipten çıkmak istiyor musun?`, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Takipten Çık', style: 'destructive', onPress: async () => {
          const r = await authActions.unfollowUser(userId);
          if (r.success) setFollowingStatus(p => ({ ...p, [userId]: false }));
        }},
      ]);
    } else {
      const r = await authActions.followUser(userId);
      if (r.success) setFollowingStatus(p => ({ ...p, [userId]: true }));
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
            <Text variant="caption" tone="primary">@{user.username || 'user'} · {fmtN(user.followersCount)} takipçi</Text>
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
                {isF ? 'Takipte' : 'Takip Et'}
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

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(['followers', 'following'] as Tab[]).map(t => {
          const on = tab === t;
          const count = t === 'followers' ? followers.length : following.length;
          return (
            <Pressable key={t} style={styles.tabItem} onPress={() => setTab(t)}>
              <Text
                variant="label"
                style={{ fontWeight: on ? '700' : '600', color: on ? colors.text : colors.textSecondary }}
              >
                {t === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}{' '}
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
          placeholder="İsim veya kullanıcı adı ara"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderUser}
          keyExtractor={u => u.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.screenX, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="people-outline" size={38} color={colors.textSecondary} />
              <Text variant="body" tone="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
                {searchQuery ? 'Eşleşen kimse yok.' : tab === 'followers' ? 'Henüz takipçi yok.' : 'Henüz kimseyi takip etmiyor.'}
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

function fmtN(n?: number) {
  const v = n || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}b` : `${v}`;
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
    fontWeight: '500',
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
