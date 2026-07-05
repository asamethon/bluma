import ImageModal from '@/components/ImageModal';
import ReportSheet from '@/components/ReportSheet';
import {
  Screen,
  Button,
  IconButton,
  SegmentedControl,
  StoryRow,
  Text,
} from '@/components/ui';
import { CategoryMeta, Radius, Spacing, useTheme } from '@/constants/theme';
import { useFollow } from '@/features/social/hooks/useFollow';
import { ProfileConversationCard } from '@/features/profile/components/ProfileConversationCard';
import { ProfileGradientHero } from '@/features/profile/components/ProfileGradientHero';
import { ProfileStatCell } from '@/features/profile/components/ProfileStatCell';
import { ProfileStoryShelf } from '@/features/profile/components/ProfileStoryShelf';
import { authActions, User } from '@/store/authStore';
import { useAppSelector } from '@/store/hooks';
import { moderationActions } from '@/store/moderationStore';
import { Conversation, Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
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

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const currentUser = useAppSelector(s => s.auth.user);

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'conversations'>('stories');
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedModalImage, setSelectedModalImage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const blockedIds = useAppSelector(s => s.moderation.blockedUserIds);
  const isBlocked = !!user && blockedIds.includes(user.id);

  // ÖNEMLİ: yalnızca primitive currentUser?.id'ye bağlıyız. Daha önce
  // currentUser OBJESİNE bağlıydı; followUser local auth state'i her
  // güncellediğinde yeni obje referansı bu effect'i tetikliyor, sayfa
  // tam ekran spinner'a düşüp baştan yükleniyordu ("gidip gelme" bug'ı).
  const currentUserId = currentUser?.id;

  // Takip durumu + optimistic toggle: features/social/useFollow.
  // Takipçi sayacı da optimistic güncellenir (hatada ters delta gelir).
  const follow = useFollow(
    user?.id,
    useCallback((delta: number) => {
      setUser(u => u
        ? { ...u, followersCount: Math.max(0, (u.followersCount || 0) + delta) }
        : u);
    }, [])
  );

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await authActions.getUserById(id);
      if (userData) {
        setUser(userData);
        loadUserStories(userData.id);
        const unsub = await loadUserConversations(userData.id);
        return unsub;
      }
    } catch {
      Alert.alert('Hata', 'Kullanıcı bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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

  const handleFollow = () => {
    if (!user || !currentUser) return;
    if (follow.isFollowing) {
      Alert.alert('Takipten Çık', `${user.displayName} adlı kullanıcıyı takipten çıkmak istiyor musun?`, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Takipten Çık', style: 'destructive', onPress: follow.toggle },
      ]);
    } else {
      follow.toggle();
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
              // Engellenen kullanıcı takipteyse takibi de bırak (optimistic)
              if (follow.isFollowing) follow.toggle();
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
        <ProfileGradientHero
          avatarUri={user.profileImage}
          avatarName={user.displayName}
          accentColor={genreAccent}
          height={132}
          watermarkSize={140}
          avatarTop={72}
          actions={
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
          }
        />

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
              {/* Optimistic akış (useFollow): spinner yok, etiket anında değişir */}
              <Button
                label={follow.isFollowing ? "Takip Ediliyor" : "Takip Et"}
                variant={follow.isFollowing ? "secondary" : "primary"}
                icon={follow.isFollowing ? "checkmark" : "add"}
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
            <ProfileStatCell
              icon="book"
              value={userStories.length}
              label="Hikâye"
              color={colors.primary}
            />
            <View
              style={[styles.statsDivider, { backgroundColor: colors.border }]}
            />
            <ProfileStatCell
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
            <ProfileStatCell
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
        <ProfileStoryShelf
          title={`${firstName}'in Bahçesi`}
          count={userStories.length}
          stories={userStories}
          onStoryPress={(story) => router.push(`/story/${story.id}/preview`)}
        />

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
                <ProfileConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  onPress={() =>
                    router.push(`/conversation/${conversation.id}` as any)
                  }
                  onImagePress={(imageUri) => {
                    setSelectedModalImage(imageUri);
                    setImageModalVisible(true);
                  }}
                />
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
}

const styles = StyleSheet.create({
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
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
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
});
