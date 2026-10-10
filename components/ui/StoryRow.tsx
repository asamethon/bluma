import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { Story } from "@/types";
import { Motion, useTheme } from "@/constants/theme";
import { storyRowStyles as styles } from "@/components/ui/story-row/styles";
import { Text } from "./Text";
import { Badge } from "./Badge";
import { IconButton } from "./IconButton";
import { GenreTag } from "./Chip";
import { StoryCover } from "./story-card/StoryCover";
import { StoryByline, StoryMetrics } from "./story-card/StoryMeta";

export type StoryRowStatus = "completed" | "ongoing" | "draft" | "published";
const KNOWN_STATUSES: string[] = ["completed", "ongoing", "draft", "published"];
type StoryRowAction = {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

export const StoryRow = React.memo(function StoryRow({
  story,
  status,
  onPress,
  onMenu,
  onAuthorPress,
  action,
  style,
}: {
  story: Story;
  status?: StoryRowStatus | (string & {}) | null;
  onPress?: () => void;
  onMenu?: () => void;
  onAuthorPress?: () => void;
  action?: StoryRowAction;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, borders } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: borders.hair,
          },
          { opacity: pressed ? Motion.pressOpacity : 1 },
        ]}
      >
        <StoryCover story={story} style={styles.cover} />

        <View style={styles.body}>
          <View style={styles.eyebrowRow}>
            <GenreTag category={story.category ?? 'other'} />
            {action ? (
              <IconButton
                icon={action.icon}
                size={30}
                iconSize={16}
                color={action.color}
                onPress={event => { event.stopPropagation(); action.onPress(); }}
                accessibilityLabel={action.accessibilityLabel}
                style={styles.menuBtn}
              />
            ) : onMenu ? (
              <IconButton
                icon="ellipsis-horizontal"
                size={30}
                iconSize={16}
                color={colors.textLight}
                onPress={event => { event.stopPropagation(); onMenu(); }}
                style={styles.menuBtn}
              />
            ) : null}
          </View>

          <View style={styles.titleBlock}>
            <Text variant="storyTitle" numberOfLines={2} style={styles.title}>
              {story.title}
            </Text>
            <StoryByline story={story} onPress={onAuthorPress} />
          </View>

          <View style={styles.bodySpacer} />

          <View style={styles.metaRow}>
            <StoryMetrics story={story} views />
            {status ? (
              <View style={styles.status}>
                <Badge
                  label={KNOWN_STATUSES.includes(status) ? t(`storyStatus.${status}`) : status}
                  // Bilinen durumlar sessiz kalır; vurgu, "kaldığın bölüm" gibi
                  // kullanıcıya özel serbest metinlere ayrılır.
                  tone={
                    status === "completed" ? "success"
                    : KNOWN_STATUSES.includes(status) ? "neutral"
                    : "primary"
                  }
                />
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
});
