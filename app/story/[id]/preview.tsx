import { store } from "@/store";
import { CategoryMeta, useTheme } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import { storyActions } from "@/store/storyStore";
import { Story } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IconButton, Screen } from '@/components/ui';
import { useProfileAccess } from "@/features/privacy/hooks/useProfileAccess";
import { PrivateProfileNotice } from "@/features/privacy/components/PrivateProfileNotice";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { logger } from '@/utils/logger';

const H_GAP = 16;

export default function StoryPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const {top} = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { width: screenWidth, isTablet } = useResponsive();

  const CARD_WIDTH = Math.min(
    isTablet ? 420 : 280,
    screenWidth * (isTablet ? 0.6 : 0.7),
  );
  const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

  const styles = useMemo(
    () => createStyles(colors, CARD_WIDTH, CARD_HEIGHT),
    [colors, CARD_WIDTH, CARD_HEIGHT],
  );
  const sidePadding = Math.max(16, (screenWidth - CARD_WIDTH) / 2);
  const bodyUplift = Math.min(28, Math.round(CARD_HEIGHT * 0.1));
  const CTA_SPACE = 88;

  const [carouselData, setCarouselData] = useState<Story[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { stories, userStories, publishedUserStories } =
          store.getState().story;
        const memoryStory =
          stories.find((s) => s.id === id) ||
          userStories.find((s) => s.id === id) ||
          publishedUserStories.find((s) => s.id === id);

        let selected = memoryStory || null;

        if (
          selected &&
          selected.author &&
          selected.author.displayName &&
          selected.author.displayName !== "Anonim"
        ) {
          const allStories = stories || [];
          const cat = selected.category;
          const list = allStories
            .filter(
              (st) =>
                !!st &&
                st.id !== selected?.id &&
                (cat ? st.category === cat : true),
            )
            .slice(0, 10);
          setCarouselData([selected, ...list]);
          setActiveIndex(0);
          setIsLoading(false);

          storyActions
            .getStoryWithOfflineFallback(id)
            .then((freshStory) => {
              if (freshStory) {
                const updatedList = allStories
                  .filter(
                    (st) =>
                      !!st &&
                      st.id !== freshStory.id &&
                      (cat ? st.category === cat : true),
                  )
                  .slice(0, 10);
                setCarouselData([freshStory, ...updatedList]);
              }
            })
            .catch((e) => logger.debug("Background update failed:", e));

          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ x: 0, animated: true });
          });
          return;
        }

        const online = await storyActions.getStoryWithOfflineFallback(id);
        selected = online || null;

        const allStories = stories || [];
        const cat = selected?.category;
        const list = allStories
          .filter(
            (st) =>
              !!st &&
              st.id !== selected?.id &&
              (cat ? st.category === cat : true),
          )
          .slice(0, 10);
        setCarouselData([...(selected ? [selected] : []), ...list]);
        setActiveIndex(0);

        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ x: 0, animated: true });
        });
      } catch (error) {
        logger.error("Error loading story:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const current = useMemo<Story | null>(() => {
    return carouselData[activeIndex] || null;
  }, [carouselData, activeIndex]);

  // Gizli hesabın hikâyesi doğrudan bağlantıyla da açılamaz.
  const access = useProfileAccess(current?.author);

  const getSectionTitle = (): string => {
    if (current?.isEditorsPick) return t("home.editorsPick");
    const meta = current?.category ? CategoryMeta[current.category] : undefined;
    return meta ? t(meta.label) : t("tabs.discover");
  };

  const formatNumber = (n?: number) => {
    if (!n) return "0";
    if (n < 1000) return `${n}`;
    if (n < 1000000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
    return `${(n / 1_000_000).toFixed(1)}M`;
  };

  const handleSave = async () => {
    const { user } = store.getState().auth;
    if (!user?.id || !current) return;
    await storyActions.saveStory(current.id);
  };

  const handleOpenInfo = () => {
    if (!current) return;
    router.push(`/story/${current.id}/info`);
  };

  if (isLoading) {
    return (
      <Screen edges={["bottom"]} style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.headerRow, {paddingTop: top }]}>
          <IconButton icon="chevron-back" iconSize={26} glass onPress={() => router.back()} />
          <Text style={styles.headerTitle}>{t("tabs.discover")}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t("storyScreen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (access.locked || access.checking) {
    return (
      <Screen edges={["bottom"]} style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.headerRow, {paddingTop: top }]}>
          <IconButton icon="chevron-back" iconSize={26} glass onPress={() => router.back()} />
          <Text style={styles.headerTitle}>{t("tabs.discover")}</Text>
          <View style={{ width: 40 }} />
        </View>
        {access.locked && (
          <View style={{ marginTop: 40 }}>
            <PrivateProfileNotice name={current?.author?.displayName?.split(" ")[0]} />
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.headerRow, {paddingTop: top }]}>
        <IconButton icon="chevron-back" iconSize={26} glass onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{getSectionTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>

      {carouselData.length > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.carousel,
            { paddingHorizontal: sidePadding },
          ]}
          snapToInterval={CARD_WIDTH + H_GAP}
          decelerationRate={0.95}
          snapToAlignment="start"
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const index = Math.round(x / (CARD_WIDTH + H_GAP));
            setActiveIndex(
              Math.max(0, Math.min(index, carouselData.length - 1)),
            );
            setExpanded(false);
          }}
        >
          {carouselData.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.card,
                i === activeIndex ? styles.cardShadow : null,
              ]}
            >
              <Image
                source={{ uri: s.coverImage }}
                style={styles.cardImage}
                contentFit="cover"
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>{t("story.notFound")}</Text>
        </View>
      )}

      {current && (
        <View style={[styles.body, { marginTop: -bodyUplift }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {current.title || t("common.story")}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  current.authorId && router.push(`/user/${current.authorId}`)
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text style={styles.username}>
                  {current.author?.username
                    ? `@${current.author.username}`
                    : "@yazar"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleSave} style={styles.saveIcon}>
              <Ionicons name="bookmark-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons
                name="eye-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>
                {formatNumber(current.viewsCount)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons
                name="book-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>{current.chaptersCount || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons
                name="heart-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>
                {formatNumber(current.likesCount)}
              </Text>
            </View>
          </View>

          {!!current.description && (
            <Text numberOfLines={expanded ? undefined : 3} style={styles.desc}>
              {`"${current.description}"`}
            </Text>
          )}
          {!!current.description && (
            <TouchableOpacity onPress={() => setExpanded((p) => !p)}>
              <Text style={styles.moreLink}>
                {expanded
                  ? t("storyScreen.showLess")
                  : t("storyScreen.showMore")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ height: bottom + CTA_SPACE }} />

      {current && (
        <View style={[styles.ctaBar, { bottom: bottom + 16 }]}>
          <Text style={styles.ctaText}>{t("storyScreen.ctaText")}</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleOpenInfo}>
            <Ionicons name="book-outline" color={colors.surface} size={18} />
            <Text style={styles.ctaButtonText}>
              {t("storyScreen.startReading")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: any, CARD_WIDTH: number, CARD_HEIGHT: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 6,
      gap: 8,
    },
    headerTitle: {
      flex: 1,
      textAlign: "left",
      fontSize: 22,
      lineHeight: 29,
      fontWeight: "800",
      color: colors.text,
    },
    carousel: { paddingHorizontal: 20, paddingVertical: 12, gap: H_GAP },
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardShadow: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    cardImage: { width: "100%", height: "100%" },
    body: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
    titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    title: {
      fontSize: 26,
      lineHeight: 34,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 2,
    },
    username: { color: colors.primary, fontWeight: "700" },
    saveIcon: { padding: 8 },
    statsRow: {
      flexDirection: "row",
      gap: 18,
      alignItems: "center",
      marginBottom: 10,
    },
    stat: { flexDirection: "row", alignItems: "center", gap: 6 },
    statText: { color: colors.textSecondary, fontWeight: "600" },
    desc: { color: colors.text, lineHeight: 22, marginBottom: 6 },
    moreLink: { color: colors.primary, fontWeight: "700" },
    ctaBar: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 24,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    ctaText: { color: colors.text, fontWeight: "700" },
    ctaButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    ctaButtonText: { color: colors.surface, fontWeight: "800" },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      lineHeight: 21,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      lineHeight: 21,
      color: colors.textSecondary,
      fontWeight: "500",
    },
  });
