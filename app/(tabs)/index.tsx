import OfflineIndicator from "@/components/OfflineIndicator";
import {
  Screen,
  BloomMark,
  Chip,
  CategoryChip,
  IconButton,
  SectionHeader,
  StoryCardFeature,
  StoryCardSpine,
  StoryRow,
  Text,
} from "@/components/ui";
import { CategoryMeta, Radius, Spacing, categoryColor, useTheme } from "@/constants/theme";
import { useGuestGate } from "@/contexts/GuestContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useResponsiveGrid } from "@/hooks/useResponsive";
import { useAppSelector } from "@/store/hooks";
import { messagingActions } from "@/store/messagingStore";
import { moderationActions } from "@/store/moderationStore";
import { preferencesActions } from "@/store/preferencesStore";
import { storyActions } from "@/store/storyStore";
import { WriterNudgeCard } from "@/features/story/components/WriterNudgeCard";
import { useRecommendations } from "@/features/story/hooks/useRecommendations";
import { useWriterActivation } from "@/features/story/hooks/useWriterActivation";
import { readingProgressActions } from "@/features/story/services/readingProgress";
import { privacyActions } from "@/features/privacy/services/privacyService";
import { Story } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORY_RAIL = [
  "romance",
  "fantasy",
  "sci_fi",
  "mystery",
  "adventure",
  "horror",
  "comedy",
  "drama",
  "poetry",
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const {top} = useSafeAreaInsets();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const currentUser = useAppSelector(s => s.auth.user);
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const unreadCount = useAppSelector(s => s.notification.unreadCount);
  const dmUnread = useAppSelector(s =>
    s.messaging.threads.reduce((n, t) => n + (t.unread || 0), 0)
  );
  const { startAuth } = useGuestGate();
  const { numColumns, columnWidth } = useResponsiveGrid();
  const writer = useWriterActivation();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [offlineModeInfo, setOfflineModeInfo] = useState({
    isOffline: false,
    offlineStoriesCount: 0,
  });

  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editorsPicksState, setEditorsPicksState] = useState<Story[]>([]);
  const continueReading = useAppSelector(s => s.story.continueReading);


  useEffect(() => { preferencesActions.load(); }, []);

  useEffect(() => {
    if (currentUser?.id) {
      storyActions.initializeRealTimeListeners();
      moderationActions.loadBlockedUsers();
      privacyActions.load();
      messagingActions.startThreadsListener(currentUser.id);
    } else if (isGuest) {
      storyActions.setupStoriesListener();
      storyActions.loadDiscoverStories();
    }
    return () => {
      storyActions.cleanupRealTimeListeners();
    };
  }, [currentUser?.id, isGuest]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentUser?.id) {
        storyActions.refreshLikedStoriesState();
        loadOfflineModeInfo();
        readingProgressActions.loadContinueReadingShelf();
      }
    }, [currentUser?.id])
  );

  const loadOfflineModeInfo = async () => {
    const info = await storyActions.getOfflineModeInfo();
    setOfflineModeInfo(info);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (networkStatus.isOffline) {
      await storyActions.loadOfflineStories();
      await loadOfflineModeInfo();
    }
    setRefreshing(false);
  };

  const handleStoryPress = useCallback((storyId: string) => {
    router.push(`/story/${storyId}/preview`);
  }, [router]);

  const rawStories = useAppSelector(s => s.story.stories);
  const blockedIds = useAppSelector(s => s.moderation.blockedUserIds);
  const matureOn = useAppSelector(s => s.preferences.showMatureContent);
  const followingIds = useAppSelector(s => s.privacy.followingIds);
  const allStories = useMemo(
    () =>
      preferencesActions.filterMature(
        moderationActions.filterHidden(
          // Gizli hesapların hikâyeleri takipçi olmayanlara gösterilmez.
          privacyActions.filterPrivateContent(
            moderationActions.filterBlocked(rawStories, blockedIds),
            followingIds
          )
        ),
        matureOn,
        isGuest
      ),
    [rawStories, blockedIds, matureOn, isGuest, followingIds]
  );

  const forYou = useRecommendations(allStories);

  const newest = useMemo(
    () =>
      [...allStories]
        .sort(
          (a, b) =>
            new Date(b.createdAt as any).getTime() -
            new Date(a.createdAt as any).getTime()
        )
        .slice(0, 12),
    [allStories]
  );
  const mostRead = useMemo(
    () =>
      [...allStories]
        .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
        .slice(0, 12),
    [allStories]
  );
  const byCategory = (cat: string) =>
    allStories.filter((s) => s.category === (cat as any)).slice(0, 12);

  const categoryStories = useMemo(
    () =>
      selectedCategory
        ? allStories
            .filter((s) => s.category === (selectedCategory as any))
            .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
        : null,
    [allStories, selectedCategory]
  );

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreStories, setHasMoreStories] = useState(true);
  const handleLoadMoreStories = async () => {
    if (!categoryStories || loadingMore || !hasMoreStories) return;
    setLoadingMore(true);
    try {
      const hasMore = await storyActions.loadMoreStories();
      setHasMoreStories(hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const computeEditorsPicks = async () => {
      if (!allStories || allStories.length === 0) {
        setEditorsPicksState([]);
        return;
      }
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const scored = allStories.map((s) => {
        const created = (s.createdAt as any)?.toDate
          ? (s.createdAt as any).toDate().getTime()
          : new Date(s.createdAt as any).getTime();
        const ageMs = Math.max(1, now - created);
        const isRecent = ageMs <= sevenDaysMs;
        const base = storyActions.calculatePopularityScore(s);
        const momentumBoost = isRecent ? 1.25 : 1.0;
        return { story: s, score: base * momentumBoost };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 12);

      try {
        const cacheStr = await AsyncStorage.getItem("editors_picks_cache");
        if (cacheStr) {
          const cache = JSON.parse(cacheStr) as {
            ids: string[];
            expiresAt: number;
          };
          const threshold = (top[top.length - 1]?.score || 0) * 0.6;
          const cachedStories = cache.ids
            .map((id) => scored.find((x) => x.story.id === id))
            .filter(
              (x): x is { story: Story; score: number } =>
                !!x && x.score >= threshold
            )
            .map((x) => x.story);
          const isExpired = Date.now() > cache.expiresAt;
          if (!isExpired && cachedStories.length > 0) {
            setEditorsPicksState(cachedStories);
            return;
          }
        }
      } catch {}

      const topStories = top.map((x) => x.story);
      setEditorsPicksState(topStories);
      try {
        await AsyncStorage.setItem(
          "editors_picks_cache",
          JSON.stringify({
            ids: topStories.map((s) => s.id),
            expiresAt: Date.now() + 12 * 60 * 60 * 1000,
          })
        );
      } catch {}
    };
    computeEditorsPicks();
  }, [allStories]);

  const featured = editorsPicksState[0];
  const editorsRest = editorsPicksState.slice(1, 12);

  const renderList = (title: string, list: Story[], accent?: string) => {
    if (!list || list.length === 0) return null;
    return (
      <View style={styles.section} key={title}>
        <SectionHeader title={title} accent={accent} />
        <View
          style={{
            paddingHorizontal: Spacing.screenX,
            flexDirection: numColumns > 1 ? "row" : "column",
            flexWrap: numColumns > 1 ? "wrap" : "nowrap",
            gap: Spacing.md,
          }}
        >
          {list.slice(0, 6).map((story) => (
            <View key={story.id} style={numColumns > 1 ? { width: columnWidth } : undefined}>
              <StoryRow
                story={story}
                status={story.isCompleted ? "completed" : "ongoing"}
                onPress={() => handleStoryPress(story.id)}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderShelf = (title: string, list: Story[], accent?: string) => {
    if (!list || list.length === 0) return null;
    return (
      <View style={styles.section} key={title}>
        <SectionHeader title={title} accent={accent} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelf}
        >
          {list.map((story) => (
            <StoryCardSpine
              key={story.id}
              story={story}
              onPress={() => handleStoryPress(story.id)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const firstName = isGuest ? t('home.guestReader') : (currentUser?.displayName?.split(" ")[0] || t('home.reader'));

  const hour = new Date().getHours();
  const greeting = isGuest ? t('home.greetingGuest') :
    hour >= 6 && hour < 12 ? t('home.greetingMorning') :
    hour >= 12 && hour < 18 ? t('home.greetingAfternoon') :
    hour >= 18 && hour < 22 ? t('home.greetingEvening') :
    t('home.greetingNight');

  const commonHeader = (
    <>
      <View style={[styles.header, { paddingTop: top }]}>
        <BloomMark size={30} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text variant="caption" tone="textLight">{greeting}</Text>
          <Text variant="heading" style={{ marginTop: 1 }}>{firstName}</Text>
        </View>
        <View style={styles.headerActions}>
          {isGuest ? (
            <TouchableOpacity
              style={[styles.guestLoginPill, { backgroundColor: colors.primary }]}
              onPress={() => startAuth('signup')}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, lineHeight: 17}}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          ) : (
            <>
              {networkStatus.isOffline && (
                <IconButton
                  icon="cloud-offline"
                  onPress={() => router.push("/profile/offline")}
                  color={colors.primary}
                  glass
                />
              )}
              <IconButton
                icon="mail-outline"
                onPress={() => router.push("/messages" as any)}
                variant="sunk"
                glass
                size={42}
                badge={dmUnread}
              />
              <View style={{ position: 'relative' }}>
                <IconButton
                  icon="notifications-outline"
                  onPress={() => router.push("/notifications" as any)}
                  variant="sunk"
                  glass
                  size={42}
                />
                {unreadCount > 0 && (
                  <View style={[styles.notifBadge, { backgroundColor: colors.bloom, borderColor: colors.background }]}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        <Chip
          label={t('home.all')}
          icon="apps"
          active={selectedCategory === null}
          onPress={() => setSelectedCategory(null)}
        />
        {CATEGORY_RAIL.map((cat) => (
          <CategoryChip
            key={cat}
            category={cat}
            active={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
          />
        ))}
      </ScrollView>

      {networkStatus.isOffline && (
        <Pressable style={styles.offlineNote} onPress={() => router.push("/profile/offline")}>
          <View style={styles.offlineIcon}>
            <IconButton icon="cloud-offline" color={colors.primary} size={36} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" color={colors.primary}>{t('home.offlineMode')}</Text>
            <Text variant="caption" tone="textSecondary">
              {t('home.offlineReadable', { count: offlineModeInfo.offlineStoriesCount })}
            </Text>
          </View>
          <IconButton icon="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>
      )}
    </>
  );

  const idleModeContent = !categoryStories ? (
    <>
      {writer.showCard && (
        <View style={{ marginTop: Spacing.xl, paddingHorizontal: Spacing.screenX }}>
          <WriterNudgeCard
            prompt={writer.prompt}
            starting={writer.starting}
            onStart={writer.startBlank}
            onStartWithPrompt={writer.startWithPrompt}
          />
        </View>
      )}

      {!isGuest && continueReading.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title={t('home.continueReading')} accent={colors.primary} />
          <View style={{ paddingHorizontal: Spacing.screenX, gap: Spacing.md }}>
            {continueReading.map(({ story, chapterIndex }) => (
              <StoryRow
                key={story.id}
                story={story}
                status={t('home.leftAtChapter', { chapter: chapterIndex + 1 })}
                onPress={() =>
                  router.push(`/story/${story.id}?chapter=${chapterIndex}` as any)
                }
              />
            ))}
          </View>
        </View>
      )}

      {featured && (
        <View style={styles.section}>
          <SectionHeader title={t('home.editorsPick')} accent={colors.secondary} />
          <StoryCardFeature story={featured} onPress={() => handleStoryPress(featured.id)} />
        </View>
      )}

      {renderShelf(t('home.weeklyHighlights'), editorsRest, colors.bloom)}
      {renderShelf(t('home.forYou'), forYou, colors.primary)}
      {renderShelf(t('home.mostRead'), mostRead, colors.secondary)}
      {renderList(t('home.newArrivals'), newest, categoryColor('adventure'))}
      {CATEGORY_RAIL.map((cat) =>
        renderShelf(CategoryMeta[cat] ? t(CategoryMeta[cat].label) : cat, byCategory(cat), categoryColor(cat))
      )}

      {allStories.length === 0 && (
        <View style={styles.empty}>
          <BloomMark size={64} color={colors.primaryLight} coreColor={colors.bloomLight} />
          <Text variant="heading" center style={{ marginTop: Spacing.xl }}>
            {t('home.emptyTitle')}
          </Text>
          <Text variant="body" tone="textSecondary" center style={{ marginTop: Spacing.sm }}>
            {t('home.emptySub')}
          </Text>
        </View>
      )}
    </>
  ) : null;

  const listHeader = (
    <>
      {commonHeader}
      {categoryStories && (
        <View style={styles.section}>
          <SectionHeader
            title={CategoryMeta[selectedCategory!] ? t(CategoryMeta[selectedCategory!].label) : selectedCategory!}
            accent={categoryColor(selectedCategory!)}
          />
        </View>
      )}
      {idleModeContent}
    </>
  );

  const renderStoryItem = useCallback(
    ({ item: story }: { item: Story }) => (
      <View
        style={
          numColumns > 1
            ? { paddingHorizontal: Spacing.gutter / 2, marginBottom: Spacing.md }
            : { paddingHorizontal: Spacing.screenX, marginBottom: Spacing.md }
        }
      >
        <StoryRow
          story={story}
          status={story.isCompleted ? "completed" : "ongoing"}
          onPress={() => handleStoryPress(story.id)}
        />
      </View>
    ),
    [numColumns, handleStoryPress]
  );

  return (
    <Screen edges={[]} style={styles.container}>
      <OfflineIndicator showWhenOnline={true} />

      <FlashList
        key={`grid-${numColumns}`}
        data={categoryStories ?? []}
        keyExtractor={(story) => story.id}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 140,
          paddingHorizontal: numColumns > 1 ? Spacing.screenX : 0,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.bloom} />
        }
        ListHeaderComponent={listHeader}
        onEndReached={handleLoadMoreStories}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          categoryStories ? (
            <View style={styles.empty}>
              <BloomMark size={64} color={colors.primaryLight} coreColor={colors.bloomLight} />
              <Text variant="body" tone="textSecondary" center style={{ marginTop: Spacing.sm }}>
                {t('home.noStoriesInGenre')}
              </Text>
            </View>
          ) : null
        }
        renderItem={renderStoryItem}
      />
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.screenX,
      paddingBottom: Spacing.lg,
    },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 2 },
    guestLoginPill: {
      paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: Radius.pill,
    },
    rail: {
      paddingHorizontal: Spacing.screenX,
      gap: Spacing.sm,
      paddingBottom: Spacing.lg,
    },
    section: { marginTop: Spacing.xl },
    shelf: {
      paddingHorizontal: Spacing.screenX,
      gap: Spacing.lg,
      paddingRight: Spacing.sm,
    },
    offlineNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      marginHorizontal: Spacing.screenX,
      marginTop: Spacing.xl,
      padding: Spacing.lg,
      backgroundColor: colors.primarySoft,
      borderRadius: Radius.lg,
    },
    offlineIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    empty: { alignItems: "center", paddingVertical: 80, paddingHorizontal: Spacing.huge },
    notifBadge: {
      position: "absolute", top: 2, right: 2,
      minWidth: 16, height: 16, borderRadius: 8,
      borderWidth: 1.5,
      alignItems: "center", justifyContent: "center",
      paddingHorizontal: 3,
    },
    notifBadgeText: { color: "#fff", fontSize: 9, lineHeight: 12, fontWeight: "800" },
  });
