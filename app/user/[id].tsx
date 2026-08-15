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
import { useCanMessage } from '@/features/privacy/hooks/useCanMessage';
import { useProfileAccess } from '@/features/privacy/hooks/useProfileAccess';
import { PrivateProfileNotice } from '@/features/privacy/components/PrivateProfileNotice';
import { useGuestGate } from '@/contexts/GuestContext';
import { ProfileConversationCard } from '@/features/profile/components/ProfileConversationCard';
import { ProfileGradientHero } from '@/features/profile/components/ProfileGradientHero';
import { ProfileStatCell } from '@/features/profile/components/ProfileStatCell';
import { ProfileStoryShelf } from '@/features/profile/components/ProfileStoryShelf';
import { authActions } from '@/store/authStore';
import { useProfileUser } from '@/features/profile/hooks/useProfileUser';
import { useAppSelector } from '@/store/hooks';
import { moderationActions } from '@/store/moderationStore';
import { Conversation, Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currentUser = useAppSelector(s => s.auth.user);
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const { startAuth } = useGuestGate();

  // Profil dokümanı canlı dinlenir; sayaç/gizlilik değişimi anında yansır.
  const { user, isLoading } = useProfileUser(id);
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

  const currentUserId = currentUser?.id;

  // Gizli hesap: içerik yalnızca takipçilere; mesaj izni ayrı kontrol edilir.
  const access = useProfileAccess(user);
  const { allowed: canMessage, checking: messageCheckPending } = useCanMessage(user?.id);
  const contentHidden = access.locked || access.checking;

  // Takipçi sayacı da canlı dokümandan geldiği için iyimser düzeltme gerekmez.
  const follow = useFollow(user?.id, undefined, { live: true });

  useEffect(() => {
    const profileId = user?.id;
    if (!profileId) return;
    let convUnsub: (() => void) | undefined;
    let cancelled = false;

    loadUserStories(profileId);
    loadUserConversations(profileId).then(unsub => {
      if (!unsub) return;
      if (cancelled) unsub();
      else convUnsub = unsub;
    });

    return () => {
      cancelled = true;
      if (convUnsub) convUnsub();
    };
  }, [user?.id]);

  useEffect(() => {
    if (currentUserId) moderationActions.loadBlockedUsers();
  }, [currentUserId]);

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
        const author = await authActions.getUserById(userId);
        const list: Conversation[] = snap.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() } as Conversation;
          if (data.authorId && author) data.author = author;
          return data;
        });
        setUserConversations(list);
        setConversationsLoading(false);
      }, () => setConversationsLoading(false));
      return unsub;
    } catch { setConversationsLoading(false); }
  };

  const handleFollow = () => {
    if (!user || !currentUser) return;
    if (follow.isFollowing) {
      Alert.alert(t('social.unfollowTitle'), t('social.unfollowConfirm', { name: user.displayName }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('social.unfollowTitle'), style: 'destructive', onPress: follow.toggle },
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
        if (r.success) Alert.alert(t('userProfile.unblockedTitle'), t('userProfile.unblockedMessage', { name: user.displayName }));
        else Alert.alert(t('common.error'), r.error || t('moderation.unblockFailed'));
      });
      return;
    }
    Alert.alert(
      t('userProfile.blockTitle'),
      t('userProfile.blockConfirm', { name: user.displayName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('userProfile.block'),
          style: 'destructive',
          onPress: async () => {
            const r = await moderationActions.blockUser(user.id);
            if (r.success) {
              if (follow.isFollowing) follow.toggle();
              Alert.alert(t('userProfile.blockedTitle'), t('userProfile.blockedMessage'));
            } else {
              Alert.alert(t('common.error'), r.error || t('moderation.blockFailed'));
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
        <Text variant="body" tone="textSecondary">{t('errors.userNotFound')}</Text>
        <Button label={t('userProfile.goBack')} variant="ghost" size="sm" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </Screen>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;
  const firstName = user.displayName?.split(' ')[0] || user.displayName || '';
  const primaryGenre = user.interests?.[0];
  const genreAccent = primaryGenre ? (CategoryMeta[primaryGenre]?.color ?? '#FF85A8') : '#FF85A8';

  const tabOptions = [
    { value: 'stories', label: t('userProfile.storiesTab'), icon: 'library-outline' as const },
    { value: 'conversations', label: t('userProfile.conversationsTab'), icon: 'chatbubble-ellipses-outline' as const },
  ];

  const renderTabItem = ({ item }: { item: any }) => (
    <View style={{ paddingHorizontal: Spacing.screenX }}>
      {activeTab === "stories" ? (
        <StoryRow
          story={item as Story}
          status={(item as Story).isCompleted ? "completed" : "ongoing"}
          onPress={() => router.push(`/story/${item.id}/preview`)}
        />
      ) : (
        <ProfileConversationCard
          conversation={item as Conversation}
          onPress={() => router.push(`/conversation/${item.id}` as any)}
          onImagePress={(imageUri: string) => {
            setSelectedModalImage(imageUri);
            setImageModalVisible(true);
          }}
        />
      )}
    </View>
  );

  const itemSeparator = () => <View style={{ height: Spacing.md }} />;

  const listHeader = (
    <>
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

          {!isOwnProfile && (
            <View style={styles.actionRow}>
              <Button
                label={
                  follow.isFollowing
                    ? t('social.following')
                    : follow.isRequested
                      ? t('social.requested')
                      : t('social.follow')
                }
                variant={follow.isFollowing || follow.isRequested ? "secondary" : "primary"}
                icon={
                  follow.isFollowing ? "checkmark" : follow.isRequested ? "time-outline" : "add"
                }
                size="md"
                onPress={handleFollow}
                style={{ flex: 1 }}
              />
              {/* Mesajlara kapalı hesapta buton hiç görünmez. */}
              {(isGuest || (!messageCheckPending && canMessage)) && (
                <Button
                  label={t('messages.chat')}
                  variant="secondary"
                  size="md"
                  icon="mail-outline"
                  onPress={() => {
                    if (isGuest) { startAuth('signup'); return; }
                    if (user) router.push(`/messages/${user.id}` as any);
                  }}
                />
              )}
            </View>
          )}

          <View
            style={[
              styles.statsBar,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <ProfileStatCell
              icon="book"
              value={userStories.length}
              label={t('common.story')}
              color={colors.primary}
            />
            <View
              style={[styles.statsDivider, { backgroundColor: colors.border }]}
            />
            <ProfileStatCell
              icon="people"
              value={user.followersCount || 0}
              label={t('profileScreen.followers')}
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
              label={t('profileScreen.followingShort')}
              color={colors.textSecondary}
              onPress={() =>
                router.push(`/profile/following/${user.id}` as any)
              }
            />
          </View>
        </View>

        {access.locked ? (
          <View style={{ marginTop: 24 }}>
            <PrivateProfileNotice name={firstName} pending={follow.isRequested} />
          </View>
        ) : contentHidden ? null : (
          <>
            <ProfileStoryShelf
              title={t('userProfile.usersGarden', { name: firstName })}
              count={userStories.length}
              stories={userStories}
              onStoryPress={(story) => router.push(`/story/${story.id}/preview`)}
            />

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
          </>
        )}

    </>
  );

  const listEmpty = contentHidden ? null :
    activeTab === "stories" ? (
      <View style={styles.empty}>
        <Ionicons name="leaf-outline" size={32} color={colors.textSecondary} />
        <Text variant="body" tone="textSecondary" style={{ marginTop: 8, textAlign: "center" }}>
          {isOwnProfile
            ? t('profileScreen.noPublishedStories')
            : t('userProfile.authorNoStories')}
        </Text>
      </View>
    ) : conversationsLoading ? (
      <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
    ) : (
      <View style={styles.empty}>
        <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.textSecondary} />
        <Text variant="body" tone="textSecondary" style={{ marginTop: 8, textAlign: "center" }}>
          {isOwnProfile
            ? t('userProfile.noConversations')
            : t('userProfile.authorNoMessages')}
        </Text>
      </View>
    );

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <FlashList
        data={contentHidden ? [] : activeTab === "stories" ? userStories : userConversations}
        keyExtractor={(item: any) => item.id}
        renderItem={renderTabItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={itemSeparator}
        key={activeTab}
      />

      <ImageModal
        visible={imageModalVisible}
        imageUri={selectedModalImage || ""}
        onClose={() => {
          setImageModalVisible(false);
          setSelectedModalImage(null);
        }}
      />

      {showMenu && (
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Ionicons name="flag-outline" size={18} color={colors.text} />
              <Text variant="body">{t('report.targetUser')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleToggleBlock}>
              <Ionicons name={isBlocked ? 'person-add-outline' : 'person-remove-outline'} size={18} color={isBlocked ? colors.text : colors.error} />
              <Text variant="body" color={isBlocked ? colors.text : colors.error}>
                {isBlocked ? t('userProfile.unblock') : t('userProfile.block')}
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
