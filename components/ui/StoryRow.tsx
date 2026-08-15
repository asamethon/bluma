import React from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import type { Story } from "@/types";
import { Radius, Spacing, categoryColor, useTheme } from "@/constants/theme";
import { formatCount } from "@/utils/format";
import { Text } from "./Text";
import { Badge } from "./Badge";

export type StoryRowStatus = "completed" | "ongoing" | "draft" | "published";
const KNOWN_STATUSES: string[] = ["completed", "ongoing", "draft", "published"];

export const StoryRow = React.memo(function StoryRow({
  story,
  status,
  onPress,
  onMenu,
  style,
}: {
  story: Story;
  status?: StoryRowStatus | (string & {}) | null;
  onPress?: () => void;
  onMenu?: () => void;
  style?: any;
}) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const accent = categoryColor(story.category, colors.primary);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.sm, style]}
    >
      <View style={[styles.cover, { backgroundColor: accent + "33" }]}>
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
          <Ionicons name="book" size={22} color={accent} />
        )}
        <View style={[styles.spine, { backgroundColor: accent }]} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="subheading" numberOfLines={2} style={styles.title}>
            {story.title}
          </Text>
          {onMenu && (
            <TouchableOpacity onPress={onMenu} style={styles.menuBtn} hitSlop={8}>
              <Ionicons name="ellipsis-vertical" size={16} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {!!story.description && (
          <Text
            variant="caption"
            tone="textSecondary"
            numberOfLines={1}
            style={styles.desc}
          >
            {story.description}
          </Text>
        )}

        <View style={{ flex: 1 }} />

        <View style={styles.statsRow}>
          <Stat icon="heart-outline" value={formatCount(story.likesCount)} color={colors.textSecondary} />
          <Stat icon="eye-outline" value={formatCount(story.viewsCount)} color={colors.textSecondary} />
          {status && (
            <View style={{ marginLeft: "auto" }}>
              <Badge
                label={KNOWN_STATUSES.includes(status) ? t(`storyStatus.${status}`) : status}
                tone={
                  status === "completed" ? "bloom"
                  : status === "draft" ? "neutral"
                  : "primary"
                }
              />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

function Stat({ icon, value, color }: { icon: any; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={color} />
      <Text variant="caption" tone="textSecondary">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 14,
    padding: 12,
    borderWidth: 1,
    borderRadius: Radius.lg,
    alignItems: "stretch",
  },
  cover: {
    width: 60,
    height: 86,
    flexShrink: 0,
    borderRadius: Radius.sm,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  spine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  body: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    lineHeight: 21,
    fontSize: 16,
  },
  menuBtn: {
    padding: 2,
  },
  desc: {
    marginTop: 2,
    lineHeight: 17,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: Spacing.sm,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
