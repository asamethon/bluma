import { GuestState } from "@/components/GuestState";
import ImageModal from "@/components/ImageModal";
import {
  Badge,
  Button,
  IconButton,
  Screen,
  SegmentedControl,
  StoryRow,
  Text,
} from "@/components/ui";
import { ContentMaxWidth, Fonts, Radius, Spacing, useTheme } from "@/constants/theme";
import { ProfileConversationCard } from "@/features/profile/components/ProfileConversationCard";
import { ProfileGradientHero } from "@/features/profile/components/ProfileGradientHero";
import { ProfileStatCell } from "@/features/profile/components/ProfileStatCell";
import { ProfileStoryShelf } from "@/features/profile/components/ProfileStoryShelf";
import { imageUploadService } from "@/services/imageUploadService";
import { authActions } from "@/store/authStore";
import {
  CHALLENGE_DEFS,
  RANKS,
  challengeActions,
  getRankIndex,
} from "@/store/challengeStore";
import { conversationActions } from "@/store/conversationStore";
import { useAppSelector } from "@/store/hooks";
import { storyActions } from "@/store/storyStore";
import { Conversation, Story } from "@/types";
import { buildProfileShareUrl } from "@/utils/deepLinks";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from '@shopify/flash-list';
import { logger } from '@/utils/logger';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const isLoading = useAppSelector((s) => s.story.isLoading);
  const publishedUserStories = useAppSelector(
    (s) => s.story.publishedUserStories,
  );
  const userConversations = useAppSelector(
    (s) => s.conversation.userConversations,
  );
  const [imageModalVisible, setImageModalVisible] = React.useState(false);
  const [selectedModalImage, setSelectedModalImage] = React.useState<
    string | null
  >(null);

  const [activeTab, setActiveTab] = useState<"stories" | "conversations">(
    "stories",
  );

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageImage, setMessageImage] = useState<string | null>(null);
  const [notifyFollowers, setNotifyFollowers] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      storyActions.initializeRealTimeListeners();
      storyActions.setupPublishedUserStoriesListener(currentUser.id);
      authActions.setupUserListener(currentUser.id);
      conversationActions.getUserConversations(currentUser.id);
      conversationActions.getLikedConversations(currentUser.id);
      challengeActions.loadProgress(currentUser.id);
      return () => {
        storyActions.cleanupRealTimeListeners();
        authActions.cleanupUserListener();
        conversationActions.cleanupListeners();
      };
    }
  }, [currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        storyActions.setupPublishedUserStoriesListener(currentUser.id);
        authActions.setupUserListener(currentUser.id);
      }
    }, [currentUser?.id]),
  );

  const handleOpenImageModal = (imageUri: string) => {
    setSelectedModalImage(imageUri);
    setImageModalVisible(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessageContent("");
    setMessageImage(null);
    setNotifyFollowers(false);
  };

  const handlePickMessageImage = async () => {
    try {
      const imageUri = await imageUploadService.pickCommentImage();
      if (imageUri) setMessageImage(imageUri);
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error
          ? error.message
          : t("imageUpload.pickError"),
      );
    }
  };

  const handlePostMessage = async () => {
    if (!messageContent.trim()) {
      Alert.alert(t('profileScreen.warning'), t('profileScreen.writeMessageFirst'));
      return;
    }
    if (!currentUser?.id) {
      Alert.alert(t('common.error'), t('errors.loginRequired'));
      return;
    }
    try {
      setIsPosting(true);
      let imageUrl: string | undefined = undefined;
      if (messageImage) {
        try {
          imageUrl = await imageUploadService.uploadCommentImage(messageImage);
        } catch {}
      }
      const conversationData: any = {
        title: "",
        content: messageContent.trim(),
        authorId: currentUser.id,
        isActive: true,
      };
      if (imageUrl) conversationData.image = imageUrl;
      const authorData: any = {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.displayName,
        authProvider: currentUser.authProvider,
      };
      if (currentUser.username) authorData.username = currentUser.username;
      if (currentUser.bio) authorData.bio = currentUser.bio;
      if (currentUser.profileImage)
        authorData.profileImage = currentUser.profileImage;
      conversationData.author = authorData;
      const result =
        await conversationActions.createConversation(conversationData);
      if (result.success) {
        if (notifyFollowers && result.conversationId) {
          try {
            await conversationActions.announceConversationToFollowers(
              result.conversationId,
              currentUser,
            );
          } catch {}
        }
        Alert.alert(t('common.success'), t('profileScreen.messageShared'));
        handleCloseMessageModal();
      } else {
        Alert.alert(
          t("common.error"),
          result.error || t("profileScreen.messageShareFailed"),
        );
      }
    } catch {
      Alert.alert(t('common.error'), t('profileScreen.messageShareFailed'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleShareProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const url = buildProfileShareUrl(currentUser.id);
      const name =
        currentUser.displayName || `@${currentUser.username || "bluma"}`;
      await Share.share({
        title: `${name} • Bluma`,
        message: t('profileScreen.shareProfileMessage', { name, url }),
      });
    } catch (e) {
      logger.error("Share profile error", e);
    }
  };

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}/preview`);
  };

  const handleStoryMenu = (story: Story) => {
    Alert.alert(t('profileScreen.storyOptionsTitle'), t('profileScreen.storyOptionsMessage'), [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('common.edit'),
        onPress: () => router.push(`/story/compose/${story.id}?ch=0` as any),
      },
      {
        text: t('profileScreen.revertToDraft'),
        onPress: async () => {
          Alert.alert(
            t('profileScreen.revertToDraft'),
            t('profileScreen.revertToDraftConfirm', { title: story.title }),
            [
              { text: t('common.cancel'), style: "cancel" },
              {
                text: t('profileScreen.revertToDraft'),
                onPress: async () => {
                  try {
                    await storyActions.updateStory(story.id, {
                      isPublished: false,
                    });
                  } catch {
                    Alert.alert(
                      t("common.error"),
                      t("profileScreen.revertToDraftFailed"),
                    );
                  }
                },
              },
            ],
          );
        },
      },
      {
        text: t('common.delete'),
        style: "destructive",
        onPress: () => {
          Alert.alert(
            t('studio.deleteStoryTitle'),
            t('profileScreen.deleteStoryConfirm', { title: story.title }),
            [
              { text: t('common.cancel'), style: "cancel" },
              {
                text: t('common.delete'),
                style: "destructive",
                onPress: async () => {
                  try {
                    await storyActions.deleteStory(story.id);
                  } catch {}
                },
              },
            ],
          );
        },
      },
    ]);
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    Alert.alert(
      t('profileScreen.deleteConversationTitle'),
      t('profileScreen.deleteConversationConfirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              await conversationActions.deleteConversation(conversation.id);
            } catch {}
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(t('profileScreen.signOut'), t('profileScreen.signOutConfirm'), [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('profileScreen.signOut'),
        style: "destructive",
        onPress: () => {
          authActions.signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const getStoryStatus = (story: Story) => {
    if (!story.isPublished) return "draft";
    if (story.isCompleted) return "completed";
    return "ongoing";
  };

  const menuItems = [
    {
      icon: "cloud-download-outline",
      title: t('profileScreen.offlineLibrary'),
      subtitle: t('profileScreen.offlineLibrarySub'),
      route: "/profile/offline",
    },
    {
      icon: "help-circle-outline",
      title: t('profileScreen.help'),
      subtitle: t('profileScreen.helpSub'),
      route: "/help",
    },
  ];

  const userStats = {
    stories: publishedUserStories.length,
    followers: currentUser?.followersCount || 0,
    following: currentUser?.followingCount || 0,
    likes: publishedUserStories.reduce(
      (sum: number, s: Story) => sum + (s.likesCount || 0),
      0,
    ),
  };

  const renderTabItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.tabRow}>
        {activeTab === "stories" ? (
          <StoryRow
            story={item as Story}
            status={getStoryStatus(item as Story)}
            onPress={() => handleStoryPress(item.id)}
            onMenu={() => handleStoryMenu(item as Story)}
          />
        ) : (
          <ProfileConversationCard
            conversation={item as Conversation}
            onPress={() => router.push(`/conversation/${item.id}` as any)}
            onImagePress={handleOpenImageModal}
            onDelete={() => handleDeleteConversation(item as Conversation)}
          />
        )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab, router],
  );

  const itemSeparator = useCallback(
    () => <View style={{ height: Spacing.md }} />,
    [],
  );

  if (isGuest) {
    return (
      <Screen style={{ flex: 1, backgroundColor: colors.background }} maxContentWidth={ContentMaxWidth.content}>
        <GuestState kind="profile" />
      </Screen>
    );
  }

  if (!currentUser) {
    return (
      <Screen
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text variant="body" tone="textSecondary">
          {t('profileScreen.loadingUser')}
        </Text>
      </Screen>
    );
  }

  const tabOptions = [
    {
      value: "stories",
      label: t('profileScreen.myStories'),
      icon: "library-outline" as const,
    },
    {
      value: "conversations",
      label: t('profileScreen.myConversations'),
      icon: "chatbubble-ellipses-outline" as const,
    },
  ];

  const listHeader = (
    <>
      <ProfileGradientHero
          avatarUri={currentUser.profileImage}
          avatarName={currentUser.displayName}
          actions={
            <View
              style={{
                flexDirection: "row",
                gap: 4,
                justifyContent: "flex-end",
                flex: 1,
              }}
            >
              <IconButton
                icon="settings-outline"
                onPress={() => router.push("/profile/settings" as any)}
                color="#fff"
                size={40}
              />
              <IconButton
                icon="log-out-outline"
                onPress={handleSignOut}
                color="#fff"
                size={40}
              />
            </View>
          }
        />

        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text variant="title" style={{ fontWeight: "700" }}>
              {currentUser.displayName}
            </Text>
            <Badge
              label={t('profileScreen.buddingAuthor')}
              tone="bloom"
              icon="ribbon"
              style={{ marginLeft: 8 }}
            />
          </View>
          <Text variant="label" tone="primary" style={{ marginTop: 2 }}>
            @
            {currentUser.username || currentUser.email?.split("@")[0] || "user"}
          </Text>
          {currentUser.bio && (
            <Text
              variant="body"
              tone="textSecondary"
              style={{ marginTop: 10, fontStyle: "italic" }}
            >
              {currentUser.bio}
            </Text>
          )}

          <View style={styles.actionRow}>
            <Button
              label={t('profileScreen.editProfile')}
              variant="primary"
              size="md"
              icon="create-outline"
              onPress={() => router.push("/profile/edit")}
              style={{ flex: 1 }}
            />
            <Button
              label={t('messages.share')}
              variant="secondary"
              size="md"
              icon="share-social-outline"
              onPress={handleShareProfile}
            />
          </View>

          <RankProgressCard
            onPress={() => router.push("/profile/challenges" as any)}
            style={{ marginTop: 16 }}
          />

          <View style={styles.statsBar}>
            <ProfileStatCell
              icon="book"
              value={userStats.stories}
              label={t('common.story')}
              color={colors.primary}
            />
            <View style={styles.statsDivider} />
            <ProfileStatCell
              icon="people"
              value={userStats.followers}
              label={t('profileScreen.followers')}
              color="#4C6FE0"
              onPress={() =>
                router.push(`/profile/followers/${currentUser.id}` as any)
              }
            />
            <View style={styles.statsDivider} />
            <ProfileStatCell
              icon="leaf"
              value={userStats.following}
              label={t('profileScreen.followingShort')}
              color={colors.primary}
              onPress={() =>
                router.push(`/profile/following/${currentUser.id}` as any)
              }
            />
            <View style={styles.statsDivider} />
            <ProfileStatCell
              icon="heart"
              value={userStats.likes}
              label={t('profileScreen.likes')}
              color={colors.bloom}
            />
          </View>
        </View>

        <ProfileStoryShelf
          title={t('profileScreen.myGarden')}
          count={publishedUserStories.length}
          stories={publishedUserStories}
          onStoryPress={(story) => handleStoryPress(story.id)}
        />

        <View style={styles.tabsWrap}>
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={(v) => setActiveTab(v as any)}
          />
        </View>

        {activeTab === "conversations" && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={[
                styles.composeBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowMessageModal(true)}
            >
              <Text variant="body" tone="textSecondary" style={{ flex: 1 }}>
                {t('profileScreen.writeAMessage')}
              </Text>
              <Ionicons
                name="camera-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}
      </>
    );

  const listEmpty =
    activeTab === "stories" ? (
      isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="document-outline" size={32} color={colors.textSecondary} />
          <Text variant="body" tone="textSecondary" style={{ marginTop: 8 }}>
            {t('profileScreen.noPublishedStories')}
          </Text>
          <Button
            label={t('profileScreen.writeFirstStory')}
            variant="primary"
            size="sm"
            onPress={() => router.push("/(tabs)/write")}
            style={{ marginTop: 12 }}
          />
        </View>
      )
    ) : (
      <View style={styles.empty}>
        <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.textSecondary} />
        <Text variant="body" tone="textSecondary" style={{ marginTop: 8 }}>
          {t('profileScreen.noMessagesShared')}
        </Text>
      </View>
    );

  const listFooter = (
    <>
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="subheading" style={{ fontSize: 15 }}>
                  {item.title}
                </Text>
                <Text variant="caption" tone="textSecondary">
                  {item.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textLight}
              />
            </TouchableOpacity>
          ))}
        </View>
    </>
  );

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }} maxContentWidth={ContentMaxWidth.content}>
      <FlashList
        data={activeTab === "stories" ? publishedUserStories : userConversations}
        keyExtractor={(item: any) => item.id}
        renderItem={renderTabItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
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

      <Modal
        visible={showMessageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseMessageModal}
      >
        <Screen style={{ flex: 1, backgroundColor: colors.background }} maxContentWidth={ContentMaxWidth.content}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseMessageModal}>
              <Text variant="body" tone="textSecondary">
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <Text variant="subheading">{t('profileScreen.shareMessage')}</Text>
            <TouchableOpacity
              style={[
                styles.shareBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !messageContent.trim() || isPosting ? 0.5 : 1,
                },
              ]}
              onPress={handlePostMessage}
              disabled={!messageContent.trim() || isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text variant="label" color="#fff">
                  {t('messages.share')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
            <TextInput
              style={[
                styles.msgInput,
                { color: colors.text, borderBottomColor: colors.border },
              ]}
              placeholder={t('profileScreen.messagePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={messageContent}
              onChangeText={setMessageContent}
              multiline
              autoFocus
              maxLength={500}
            />
            {messageImage && (
              <View style={{ position: "relative", marginBottom: 16 }}>
                <Image
                  source={{ uri: messageImage }}
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: Radius.lg,
                  }}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={{ position: "absolute", top: 8, right: 8 }}
                  onPress={() => setMessageImage(null)}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.photoBtn, { backgroundColor: colors.surface }]}
              onPress={handlePickMessageImage}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={colors.primary}
              />
              <Text variant="label" tone="primary">
                {t('profileScreen.addPhoto')}
              </Text>
            </TouchableOpacity>
            <View
              style={[styles.notifyRow, { backgroundColor: colors.surface }]}
            >
              <View style={{ flex: 1 }}>
                <Text variant="label" style={{ fontWeight: "600" }}>
                  {t('profileScreen.announceToFollowers')}
                </Text>
                <Text variant="caption" tone="textSecondary">
                  {t('profileScreen.announceToFollowersSub')}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  {
                    backgroundColor: notifyFollowers
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => setNotifyFollowers(!notifyFollowers)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    notifyFollowers && styles.toggleThumbOn,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

function RankProgressCard({
  onPress,
  style,
}: {
  onPress?: () => void;
  style?: any;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const xp = useAppSelector((s) => s.challenge.xp);
  const streak = useAppSelector((s) => s.challenge.streak);
  const claimedChallenges = useAppSelector((s) => s.challenge.claimedChallenges);
  const rankIndex = getRankIndex(xp);
  const rank = RANKS[rankIndex];
  const nextRank = RANKS[rankIndex + 1];
  const floor = rank.min;
  const ceil = nextRank ? nextRank.min : rank.min;
  const xpPct = nextRank ? Math.min((xp - floor) / (ceil - floor), 1) : 1;
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}${t('common.thousandSuffix')}` : `${n}`);
  const totalChallenges = CHALLENGE_DEFS.length;
  const doneChallenges = claimedChallenges.length;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: Radius.lg,
          padding: 16,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 2,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#5E3FB0",
          }}
        >
          <Ionicons name={rank.icon as any} size={23} color="#fff" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            variant="caption"
            style={{
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.7,
              color: colors.textLight,
            }}
          >
            {t('challengesScreen.level', { level: rankIndex + 1 })}
          </Text>
          <Text
            variant="heading"
            style={{
              fontSize: 18,
              fontWeight: "700",
              fontFamily: Fonts.serif,
              color: colors.text,
              lineHeight: 24,
            }}
          >
            {t(rank.name)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            height: 28,
            paddingHorizontal: 11,
            borderRadius: Radius.pill,
            backgroundColor: colors.surfaceVariant,
          }}
        >
          <Ionicons name="sparkles" size={12} color="#E6B95C" />
          <Text
            style={{
              fontFamily: Fonts.mono,
              fontSize: 12, lineHeight: 16,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {fmt(xp)}
          </Text>
        </View>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.surfaceVariant,
          overflow: "hidden",
          marginTop: 13,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: `${xpPct * 100}%` as any,
            height: "100%",
            borderRadius: 4,
            backgroundColor: "#7C5CD0",
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="flame" size={13} color="#E6B95C" />
            <Text
              variant="caption"
              tone="textSecondary"
              style={{ fontWeight: "600" }}
            >
              {t('challengesScreen.streakDays', { count: streak })}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={colors.primary}
            />
            <Text
              variant="caption"
              tone="textSecondary"
              style={{ fontWeight: "600" }}
            >
              {t('challengesScreen.challengesDone', { done: doneChallenges, total: totalChallenges })}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Text
            variant="caption"
            style={{ fontWeight: "700", color: colors.primary }}
          >
            {t('challengesScreen.title')}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  identity: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 48,
    paddingBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
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
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 8,
  },
  statsDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 4,
  },
  tabsWrap: {
    paddingHorizontal: Spacing.screenX,
    marginTop: 20,
    marginBottom: 16,
  },
  tabContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 8,
  },
  tabRow: {
    paddingHorizontal: Spacing.screenX,
  },
  composeBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
  },
  menuSection: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 24,
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  shareBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    minWidth: 70,
    alignItems: "center",
  },
  msgInput: {
    fontSize: 16, lineHeight: 21,
    paddingVertical: 16,
    minHeight: 120,
    textAlignVertical: "top",
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 16,
  },
  notifyRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: Radius.md,
    marginBottom: 40,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
});
