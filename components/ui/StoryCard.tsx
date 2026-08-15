import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { Story } from "@/types";
import { formatCount } from "@/utils/format";
import {
  Fonts,
  Motion,
  Radius,
  Spacing,
  categoryColor,
  categoryLabel,
  useTheme,
} from "@/constants/theme";
import { Text } from "./Text";
import { Avatar } from "./Avatar";

function BottomScrim({ color }: { color: string }) {
  return (
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.35)", color]}
      locations={[0, 0.5, 1]}
      pointerEvents="none"
      style={styles.scrim}
    />
  );
}

function usePress() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => (scale.value = withTiming(0.97, { duration: Motion.fast })),
    onPressOut: () => (scale.value = withTiming(1, { duration: Motion.fast })),
  };
}

export const StoryCardSpine = React.memo(function StoryCardSpine({
  story,
  width = 138,
  onPress,
}: {
  story: Story;
  width?: number;
  onPress?: () => void;
}) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const press = usePress();
  const accent = categoryColor(story.category, colors.primary);
  const coverH = width * 1.5;

  return (
    <Animated.View style={[{ width }, press.style]}>
      <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
        <View style={[styles.cover, { height: coverH }, shadows.md]}>
          {story.coverImage ? (
            <Image
              source={{ uri: story.coverImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={story.id}
              transition={120}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: accent + "33", alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="book" size={width * 0.3} color={accent} />
            </View>
          )}

          <View style={[styles.spine, { backgroundColor: accent }]} />

          <LinearGradient
            colors={["transparent", "rgba(21,18,28,0.32)", "rgba(21,18,28,0.78)"]}
            locations={[0.48, 0.74, 1]}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topRow}>
            <View style={[styles.genrePill, { backgroundColor: accent }]}>
              <Text variant="overline" color="#fff" style={{ fontSize: 8.5, letterSpacing: 0.6 }}>
                {categoryLabel(story.category)}
              </Text>
            </View>
            {story.isPremium && (
              <View style={styles.premium}>
                <Ionicons name="star" size={10} color={colors.secondary} />
              </View>
            )}
          </View>

          <View style={[styles.coverFooter, styles.statusRow]}>
            {story.isCompleted ? (
              <>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text variant="caption" color="#fff" style={styles.statusText}>
                  {t("storyStatus.completed")}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="layers-outline" size={12} color="#fff" />
                <Text variant="caption" color="#fff" style={styles.statusText}>
                  {t("studio.chapterCount", { count: story.chaptersCount || 1 })}
                </Text>
              </>
            )}
          </View>
        </View>

        <Text variant="bodyStrong" numberOfLines={2} style={{ marginTop: Spacing.sm, lineHeight: 20 }}>
          {story.title}
        </Text>
        <Text variant="caption" tone="textLight" numberOfLines={1} style={{ marginTop: 2 }}>
          {story.author?.username ? `@${story.author.username}` : story.author?.displayName || t("common.anonymous")}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

export const StoryCardFeature = React.memo(function StoryCardFeature({
  story,
  onPress,
}: {
  story: Story;
  onPress?: () => void;
}) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const press = usePress();
  const accent = categoryColor(story.category, colors.primary);

  return (
    <Animated.View style={[styles.featureWrap, press.style]}>
      <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
        <View style={[styles.feature, shadows.lg]}>
          {story.coverImage ? (
            <Image
              source={{ uri: story.coverImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={story.id}
              transition={120}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: accent }]} />
          )}
          <BottomScrim color={colors.black} />

          <View style={styles.featureTopRow}>
            <View style={[styles.genrePill, { backgroundColor: accent }]}>
              <Ionicons name="ribbon" size={11} color="#fff" />
              <Text variant="overline" color="#fff" style={{ fontSize: 9 }}>
                {categoryLabel(story.category)}
              </Text>
            </View>
          </View>

          <View style={styles.featureBody}>
            <Text
              variant="title"
              color="#fff"
              numberOfLines={2}
              style={{ textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 6 }}
            >
              {story.title}
            </Text>
            {!!story.description && (
              <Text variant="body" color="rgba(255,255,255,0.88)" numberOfLines={2} style={{ marginTop: 4 }}>
                {story.description}
              </Text>
            )}
            <View style={styles.featureMeta}>
              <Avatar uri={story.author?.profileImage} name={story.author?.displayName} size={26} />
              <Text variant="label" color="#fff" numberOfLines={1} style={{ flex: 1 }}>
                {story.author?.displayName || t("common.anonymous")}
              </Text>
              <View style={styles.statPill}>
                <Ionicons name="book-outline" size={12} color="#fff" />
                <Text variant="caption" color="#fff">{t("story.readingMinutesShort", { count: story.readingTime || 5 })}</Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="heart" size={12} color={colors.bloom} />
                <Text variant="caption" color="#fff">{formatCount(story.likesCount)}</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});


const styles = StyleSheet.create({
  cover: {
    width: "100%",
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: "#ccc",
  },
  spine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    opacity: 0.9,
  },
  topRow: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  genrePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  premium: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverFooter: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10.5, fontFamily: Fonts.sansSemiBold },

  featureWrap: { paddingHorizontal: Spacing.screenX },
  feature: {
    height: 280,
    borderRadius: Radius.xxl,
    overflow: "hidden",
    backgroundColor: "#ccc",
  },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "66%" },
  featureTopRow: { position: "absolute", top: Spacing.lg, left: Spacing.lg },
  featureBody: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xl,
  },
  featureMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.md,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
});
