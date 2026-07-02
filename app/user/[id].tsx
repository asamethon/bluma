import ImageModal from '@/components/ImageModal';
import ReportSheet from '@/components/ReportSheet';
import {
  Screen,
  Avatar,
  Badge,
  BloomMark,
  Button,
  IconButton,
  SegmentedControl,
  StoryCardSpine,
  StoryRow,
  Text,
} from '@/components/ui';
import { CategoryMeta, Radius, Spacing, useTheme } from '@/constants/theme';
import { authActions, authState$, User } from '@/store/authStore';
import { moderationActions, moderationState$ } from '@/store/moderationStore';
import { Conversation, Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

function fmt(n?: number) {
  const v = n || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}b` : `${v}`;
}

export default observer(function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = authState$.get();

  const [user, setUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stories' | 'conversations'>('stories');
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedModalImage, setSelectedModalImage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const blockedIds = moderationState$.blockedUserIds.get();
  const isBlocked = !!user && blockedIds.includes(user.id);

  // ÖNEMLİ: yalnızca primitive currentUser?.id'ye bağlıyız. Daha önce
  // currentUser OBJESİNE bağlıydı; followUser local auth state'i her
  // güncellediğinde yeni obje referansı bu effect'i tetikliyor, sayfa
  // tam ekran spinner'a düşüp baştan yükleniyordu ("gidip gelme" bug'ı).
  const currentUserId = currentUser?.id;

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await authActions.getUserById(id);
      if (userData) {
        setUser(userData);
        if (currentUserId && currentUserId !== userData.id) {
          const following = await authActions.isFollowingUser(userData.id);
          setIsFollowing(following);
        }
        loadUserStories(userData.id);
        const unsub = await loadUserConversations(userData.id);
        return unsub;
      }
    } catch {
      Alert.alert('Hata', 'Kullanıcı bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUserId]);

  useEffect(() => {
    let convUnsub: (() => void) | undefined;
    const load = async () => {
      if (id) {
        const unsub = await loadUserData();
        if (unsub) convUnsub = unsub;
      }
    };
    load();
    if (currentUserId) moderationActions.loadBlockedUsers();
    return () => { if (convUnsub) convUnsub(); };
  }, [id, loadUserData, currentUserId]);

  const loadUserStories = async (userId: string) => {
    try {
      const firestore = await import('@react-native-firebase/firestore');
      const { collection, query, where, orderBy, getDocs, getFirestore } = firestore;
      const db = getFirestore();
      const q = query(
        collection(db, 'stories'),
        where('authorId', '==', userId),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const stories: Story[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
      setUserStories(stories);
    } catch {}
  };

  const loadUserConversations = async (userId: string) => {
    try {
      setConversationsLoading(true);
      const { collection, query, where, orderBy, onSnapshot, getFirestore } = await import('@react-native-firebase/firestore');
      const db = getFirestore();
      const q = query(collection(db, 'conversations'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, async snap => {
        const list: Conversation[] = [];
        for (const doc of snap.docs) {
          const data = { id: doc.id, ...doc.data() } as Conversation;
          if (data.authorId) {
            const a = await authActions.getUserById(data.authorId);
            if (a) data.author = a;
          }
          list.push(data);
        }
        setUserConversations(list);
        setConversationsLoading(false);
      }, () => setConversationsLoading(false));
      return unsub;
    } catch { setConversationsLoading(false); }
  };

  // Optimistic: UI anında güncellenir, Firestore işi arka planda yürür,
  // hata olursa geri alınır. Buton spinner'ı beklemeye gerek kalmaz.
  const applyFollowState = (next: boolean) => {
    setIsFollowing(next);
    setUser(u => u
      ? { ...u, followersCount: Math.max(0, (u.followersCount || 0) + (next ? 1 : -1)) }
      : u);
  };

  const performFollowToggle = (next: boolean) => {
    if (isFollowLoading || !user) return;
    setIsFollowLoading(true);
    applyFollowState(next);
    (next ? authActions.followUser(user.id) : authActions.unfollowUser(user.id))
      .then(r => { if (!r?.success) applyFollowState(!next); })
      .catch(() => applyFollowState(!next))
      .finally(() => setIsFollowLoading(false));
  };

  const handleFollow = () => {
    if (!user || !currentUser) return;
    if (isFollowing) {
      Alert.alert('Takipten Çık', `${user.displayName} adlı kullanıcıyı takipten çıkmak istiyor musun?`, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Takipten Çık', style: 'destructive', onPress: () => performFollowToggle(false) },
      ]);
    } else {
      performFollowToggle(true);
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    setReportVisible(true);
  };

  const handleToggleBlock = () => {
    setShowMenu(false);
    if (!user) return;
    if (isBlocked) {
      moderationActions.unblockUser(user.id).then(r => {
        if (r.success) Alert.alert('Engel kaldırıldı', `${user.displayName} artık sana gösterilecek.`);
        else Alert.alert('Hata', r.error || 'Engel kaldırılamadı.');
      });
      return;
    }
    Alert.alert(
      'Kullanıcıyı engelle',
      `${user.displayName} engellensin mi? Hikâyeleri ve yorumları sana gösterilmez.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            const r = await moderationActions.blockUser(user.id);
            if (r.success) {
              if (isFollowing) {
                await authActions.unfollowUser(user.id);
                setIsFollowing(false);
              }
              Alert.alert('Engellendi', 'Bu kullanıcı artık sana gösterilmeyecek.');
            } else {
              Alert.alert('Hata', r.error || 'Engelleme başarısız.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <Screen style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="body" tone="textSecondary">Kullanıcı bulunamadı</Text>
        <Button label="Geri Dön" variant="ghost" size="sm" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </Screen>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;
  const firstName = user.displayName?.split(' ')[0] || user.displayName || '';
  const primaryGenre = user.interests?.[0];
  const genreAccent = primaryGenre ? (CategoryMeta[primaryGenre]?.color ?? '#FF85A8') : '#FF85A8';

  const tabOptions = [
    { value: 'stories', label: 'Hikayeler', icon: 'library-outline' as const },
    { value: 'conversations', label: 'Konuşmalar', icon: 'chatbubble-ellipses-outline' as const },
  ];

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Hero ──────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* diagonal deeper violet — simulates linear-gradient(120deg, violet-500, violet-700) */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: -60,
              bottom: -60,
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: "#4B2DA8",
              opacity: 0.55,
            }}
          />
          {/* genre color accent upper-right — simulates radial at 80% -10% */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -30,
              top: -30,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: genreAccent,
              opacity: 0.38,
            }}
          />
          {/* BloomMark watermark */}
          <View
            pointerEvents="none"
            style={{ position: "absolute", right: -14, top: -8, opacity: 0.16 }}
          >
            <BloomMark size={140} color="#fff" coreColor="#fff" />
          </View>
          {/* Back + more buttons */}
          <View style={styles.heroActions}>
            <IconButton
              icon="chevron-back"
              color="#fff"
              size={38}
              onPress={() => router.back()}
            />
            {currentUser?.id !== user.id && (
              <IconButton icon="ellipsis-horizontal" color="#fff" size={38} onPress={() => setShowMenu(true)} />
            )}
          </View>
          {/* Avatar */}
        </View>
        <View style={styles.heroAvatar}>
          <Avatar
            uri={user.profileImage}
            name={user.displayName}
            size={88}
            ring
          />
        </View>

        {/* ── Identity ──────────────────────────────────────────── */}
        <View style={styles.identity}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Text variant="title" style={{ fontWeight: "700" }}>
              {user.displayName}
            </Text>
          </View>
          <Text variant="label" tone="primary" style={{ marginTop: 2 }}>
            @{user.username || user.email?.split("@")[0] || "user"}
          </Text>
          {user.bio ? (
            <Text
              variant="body"
              tone="textSecondary"
              style={{ marginTop: 10, fontStyle: "italic" }}
            >
              {user.bio}
            </Text>
          ) : null}

          {/* Actions */}
          {!isOwnProfile && (
            <View style={styles.actionRow}>
              {/* Optimistic akış: spinner yok — etiket anında değişir,
                  isFollowLoading yalnızca çift tıklamayı engeller. */}
              <Button
                label={isFollowing ? "Takip Ediliyor" : "Takip Et"}
                variant={isFollowing ? "secondary" : "primary"}
                icon={isFollowing ? "checkmark" : "add"}
                size="md"
                onPress={handleFollow}
                style={{ flex: 1 }}
              />
              <Button
                label="Mesaj"
                variant="secondary"
                size="md"
                icon="mail-outline"
              />
            </View>
          )}

          {/* Stats sunk bar */}
          <View
            style={[
              styles.statsBar,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <StatCell
              icon="book"
              value={userStories.length}
              label="Hikâye"
              color={colors.primary}
            />
            <View
              style={[styles.statsDivider, { backgroundColor: colors.border }]}
            />
            <StatCell
              icon="people"
              value={user.followersCount || 0}
              label="Takipçi"
              color="#4C6FE0"
              onPress={() =>
                router.push(`/profile/followers/${user.id}` as any)
              }
            />
            <View
              style={[styles.statsDivider, { backgroundColor: colors.border }]}
            />
            <StatCell
              icon="leaf"
              value={user.followingCount || 0}
              label="Takip"
              color={colors.textSecondary}
              onPress={() =>
                router.push(`/profile/following/${user.id}` as any)
              }
            />
          </View>
        </View>

        {/* ── Garden shelf ──────────────────────────────────────── */}
        {userStories.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <View
              style={[
                styles.rowBetween,
                { paddingHorizontal: Spacing.screenX, marginBottom: 12 },
              ]}
            >
              <Text variant="heading" style={{ fontWeight: "700" }}>
                {`${firstName}'in Bahçesi`}
              </Text>
              <Text variant="caption" tone="textLight">
                {userStories.length} açan hikâye
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: Spacing.screenX,
                gap: Spacing.md,
                paddingBottom: 8,
              }}
            >
              {userStories.slice(0, 6).map((story) => (
                <StoryCardSpine
                  key={story.id}
                  story={story}
                  width={118}
                  onPress={() => router.push(`/story/${story.id}/preview`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: Spacing.screenX,
            marginTop: 20,
            marginBottom: 16,
          }}
        >
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={(v) => setActiveTab(v as any)}
          />
        </View>

        {/* ── Tab content ───────────────────────────────────────── */}
        <View style={{ paddingHorizontal: Spacing.screenX }}>
          {activeTab === "stories" ? (
            userStories.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="leaf-outline"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text
                  variant="body"
                  tone="textSecondary"
                  style={{ marginTop: 8, textAlign: "center" }}
                >
                  {isOwnProfile
                    ? "Henüz yayınlanan hikaye yok."
                    : "Bu yazar henüz hikaye yayınlamamış."}
                </Text>
              </View>
            ) : (
              <View style={{ gap: Spacing.md }}>
                {userStories.map((story) => (
                  <StoryRow
                    key={story.id}
                    story={story}
                    status={story.isCompleted ? "Tamamlandı" : "Devam ediyor"}
                    onPress={() => router.push(`/story/${story.id}/preview`)}
                  />
                ))}
              </View>
            )
          ) : conversationsLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: 32 }}
            />
          ) : userConversations.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={32}
                color={colors.textSecondary}
              />
              <Text
                variant="body"
                tone="textSecondary"
                style={{ marginTop: 8, textAlign: "center" }}
              >
                {isOwnProfile
                  ? "Henüz konuşma yok."
                  : "Bu yazar henüz mesaj paylaşmamış."}
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {userConversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.id}
                  style={[
                    styles.convCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() =>
                    router.push(`/conversation/${conversation.id}` as any)
                  }
                >
                  <Text variant="body" style={{ flex: 1 }}>
                    {conversation.content}
                  </Text>
                  {conversation.image && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedModalImage(conversation.image!);
                        setImageModalVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: conversation.image }}
                        style={styles.convImg}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  )}
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name="heart-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text variant="caption" tone="textSecondary">
                        {conversation.likesCount || 0}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text variant="caption" tone="textSecondary">
                        {conversation.commentsCount || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ImageModal
        visible={imageModalVisible}
        imageUri={selectedModalImage || ""}
        onClose={() => {
          setImageModalVisible(false);
          setSelectedModalImage(null);
        }}
      />

      {/* Overflow menu */}
      {showMenu && (
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Ionicons name="flag-outline" size={18} color={colors.text} />
              <Text variant="body">Kullanıcıyı bildir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleToggleBlock}>
              <Ionicons name={isBlocked ? 'person-add-outline' : 'person-remove-outline'} size={18} color={isBlocked ? colors.text : colors.error} />
              <Text variant="body" color={isBlocked ? colors.text : colors.error}>
                {isBlocked ? 'Engeli kaldır' : 'Engelle'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <ReportSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        target={user ? { type: 'user', targetId: user.id, reportedUserId: user.id } : null}
      />
    </Screen>
  );
});

function StatCell({ icon, value, label, color, onPress }: { icon: any; value: number; label: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text variant="heading" style={{ fontSize: 20, lineHeight: 24, fontWeight: '700' }}>{fmt(value)}</Text>
      <Text variant="caption" tone="textLight">{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 132,
    overflow: "hidden",
    backgroundColor: "#6644C0",
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  menuCard: {
    position: 'absolute',
    top: 92,
    right: Spacing.screenX,
    minWidth: 200,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  heroActions: {
    position: "absolute",
    top: 10,
    left: Spacing.screenX,
    right: Spacing.screenX,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroAvatar: {
    position: "absolute",
    left: Spacing.screenX,
    top: 72,
    zIndex: 999,
  },
  identity: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 48,
    paddingBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    marginBottom: 0,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 16,
  },
  statsDivider: {
    width: 1,
    marginVertical: 4,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  convCard: {
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  convImg: {
    width: "100%",
    height: 150,
    borderRadius: Radius.md,
    marginTop: 8,
    marginBottom: 4,
  },
});
