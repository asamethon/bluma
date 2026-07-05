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
import { useAppSelector } from "@/store/hooks";
import { moderationActions } from "@/store/moderationStore";
import { preferencesActions } from "@/store/preferencesStore";
import { storyActions } from "@/store/storyStore";
import { Story } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const currentUser = useAppSelector(s => s.auth.user);
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const unreadCount = useAppSelector(s => s.notification.unreadCount);
  const { startAuth } = useGuestGate();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [offlineModeInfo, setOfflineModeInfo] = useState({
    isOffline: false,
    offlineStoriesCount: 0,
  });

  const styles = createStyles(colors);
  const [editorsPicksState, setEditorsPicksState] = useState<Story[]>([]);
  const [readingProgress, setReadingProgress] = useState<
    { storyId: string; chapterIndex: number; updatedAt: number }[]
  >([]);


  useEffect(() => { preferencesActions.load(); }, []);

  useEffect(() => {
    if (currentUser?.id) {
      storyActions.initializeRealTimeListeners();
      moderationActions.loadBlockedUsers();
    } else if (isGuest) {
      // Guests can see public stories — start the public-safe listeners
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
        loadReadingProgress();
      }
    }, [currentUser?.id])
  );

  // "Okumaya devam et" — yerel ilerleme kayıtlarını topla (en son okunan önce)
  const loadReadingProgress = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter((k) => k.startsWith("readingProgress_"));
      if (progressKeys.length === 0) { setReadingProgress([]); return; }
      const entries = await AsyncStorage.multiGet(progressKeys);
      const parsed = entries
        .map(([key, raw]) => {
          try {
            const data = JSON.parse(raw || "{}");
            return {
              storyId: key.replace("readingProgress_", ""),
              chapterIndex: typeof data.chapterIndex === "number" ? data.chapterIndex : 0,
              updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
            };
          } catch { return null; }
        })
        .filter((p): p is { storyId: string; chapterIndex: number; updatedAt: number } => !!p)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      setReadingProgress(parsed);
    } catch {
      setReadingProgress([]);
    }
  };

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

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}/preview`);
  };

  const rawStories = useAppSelector(s => s.story.stories);
  // Engellenen yazarları ve (tercih kapalıysa) 18+ içeriği akıştan çıkar (reaktif)
  const blockedIds = useAppSelector(s => s.moderation.blockedUserIds);
  const matureOn = useAppSelector(s => s.preferences.showMatureContent);
  // useMemo şart: filterMature/filterBlocked her render'da yeni bir array
  // referansı döndürüyordu, bu da aşağıdaki editorsPicks effect'inin
  // (dep: [allStories]) her render'da tetiklenmesine yol açıyordu.
  const allStories = useMemo(
    () => preferencesActions.filterMature(moderationActions.filterBlocked(rawStories)),
    [rawStories, blockedIds, matureOn]
  );
  const newest = [...allStories]
    .sort(
      (a, b) =>
        new Date(b.createdAt as any).getTime() -
        new Date(a.createdAt as any).getTime()
    )
    .slice(0, 12);
  const mostRead = [...allStories]
    .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
    .slice(0, 12);
  const byCategory = (cat: string) =>
    allStories.filter((s) => s.category === (cat as any)).slice(0, 12);
  // Kategori çipi seçiliyken ana akış yalnızca o kategoriyi gösterir
  const categoryStories = selectedCategory
    ? allStories.filter((s) => s.category === (selectedCategory as any))
    : null;

  // "Okumaya devam et" — ilerleme kaydı olan ve katalogda bulunan hikâyeler.
  // 1. bölümde kalanlar da dahil: kullanıcı okumaya başlamış demektir.
  const continueReading = readingProgress
    .map((p) => {
      const story = allStories.find((s) => s.id === p.storyId);
      return story ? { story, chapterIndex: p.chapterIndex } : null;
    })
    .filter((x): x is { story: Story; chapterIndex: number } => !!x)
    .slice(0, 5);

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
        <View style={{ paddingHorizontal: Spacing.screenX, gap: Spacing.md }}>
          {list.slice(0, 6).map((story) => (
            <StoryRow
              key={story.id}
              story={story}
              status={story.isCompleted ? "Tamamlandı" : "Devam ediyor"}
              onPress={() => handleStoryPress(story.id)}
            />
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

  const firstName = isGuest ? "Misafir okur" : (currentUser?.displayName?.split(" ")[0] || "Okuyucu");

  const hour = new Date().getHours();
  const greeting = isGuest ? "Hoş geldin," :
    hour >= 6 && hour < 12 ? "Günaydın," :
    hour >= 12 && hour < 18 ? "İyi öğleden sonralar," :
    hour >= 18 && hour < 22 ? "İyi akşamlar," :
    "İyi geceler,";

  // Ortak header: BloomMark + greeting + notification + kategori rayı + offline not
  const commonHeader = (
    <>
      {/* Header — BloomMark + greeting + notification */}
      <View style={styles.header}>
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
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Giriş Yap</Text>
            </TouchableOpacity>
          ) : (
            <>
              {networkStatus.isOffline && (
                <IconButton
                  icon="cloud-offline"
                  onPress={() => router.push("/profile/offline")}
                  color={colors.primary}
                />
              )}
              <View style={{ position: 'relative' }}>
                <IconButton
                  icon="notifications-outline"
                  onPress={() => router.push("/(tabs)/notifications" as any)}
                  variant="sunk"
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

      {/* Category rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        <Chip
          label="Hepsi"
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

      {/* Offline note */}
      {networkStatus.isOffline && (
        <Pressable style={styles.offlineNote} onPress={() => router.push("/profile/offline")}>
          <View style={styles.offlineIcon}>
            <IconButton icon="cloud-offline" color={colors.primary} size={36} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" color={colors.primary}>Çevrimdışı Mod</Text>
            <Text variant="caption" tone="textSecondary">
              {offlineModeInfo.offlineStoriesCount} hikaye çevrimdışı okunabilir
            </Text>
          </View>
          <IconButton icon="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>
      )}
    </>
  );

  // Kategori seçiliyken: büyüyebilen tek liste (categoryStories) FlatList'in
  // `data`'sı olur; her şey diğeri ListHeaderComponent içinde kalır.
  const idleModeContent = !categoryStories ? (
    <>
      {/* Okumaya devam et — en son okunanlar, kaldığı bölümden açılır */}
      {!isGuest && continueReading.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Okumaya Devam Et" accent={colors.primary} />
          <View style={{ paddingHorizontal: Spacing.screenX, gap: Spacing.md }}>
            {continueReading.map(({ story, chapterIndex }) => (
              <StoryRow
                key={story.id}
                story={story}
                status={`Bölüm ${chapterIndex + 1}'de kaldın`}
                onPress={() =>
                  router.push(`/story/${story.id}?chapter=${chapterIndex}` as any)
                }
              />
            ))}
          </View>
        </View>
      )}

      {/* Featured editor's pick */}
      {featured && (
        <View style={styles.section}>
          <SectionHeader title="Editörün Seçimi" accent={colors.secondary} />
          <StoryCardFeature story={featured} onPress={() => handleStoryPress(featured.id)} />
        </View>
      )}

      {renderShelf("Bu Hafta Öne Çıkanlar", editorsRest, colors.secondary)}
      {renderShelf("En Çok Okunanlar", mostRead, colors.primary)}
      {renderList("Yeni Geldi", newest, colors.bloom)}
      {CATEGORY_RAIL.map((cat) =>
        renderShelf(CategoryMeta[cat]?.label ?? cat, byCategory(cat), categoryColor(cat))
      )}

      {/* empty state */}
      {allStories.length === 0 && (
        <View style={styles.empty}>
          <BloomMark size={64} color={colors.primaryLight} coreColor={colors.bloomLight} />
          <Text variant="heading" center style={{ marginTop: Spacing.xl }}>
            Bahçe henüz boş
          </Text>
          <Text variant="body" tone="textSecondary" center style={{ marginTop: Spacing.sm }}>
            İlk hikayeni yaz ve Bluma&apos;da filizlenmesini izle.
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
            title={CategoryMeta[selectedCategory!]?.label ?? selectedCategory!}
            accent={categoryColor(selectedCategory!)}
          />
        </View>
      )}
      {idleModeContent}
    </>
  );

  return (
    <Screen style={styles.container}>
      <OfflineIndicator showWhenOnline={true} />

      <FlatList
        data={categoryStories ?? []}
        keyExtractor={(story) => story.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.bloom} />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          categoryStories ? (
            <View style={styles.empty}>
              <BloomMark size={64} color={colors.primaryLight} coreColor={colors.bloomLight} />
              <Text variant="body" tone="textSecondary" center style={{ marginTop: Spacing.sm }}>
                Bu türde henüz hikâye yok.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: story }) => (
          <View style={{ paddingHorizontal: Spacing.screenX, marginBottom: Spacing.md }}>
            <StoryRow
              story={story}
              status={story.isCompleted ? "Tamamlandı" : "Devam ediyor"}
              onPress={() => handleStoryPress(story.id)}
            />
          </View>
        )}
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
      paddingTop: Spacing.md,
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
    notifBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  });
