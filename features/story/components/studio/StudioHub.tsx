import { Text } from "@/components/ui";
import { Radius, Spacing, useTheme } from "@/constants/theme";
import { useResponsiveGrid } from "@/hooks/useResponsive";
import { Story } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { FlashList } from '@shopify/flash-list';
import { StudioStoryCard } from "./StudioStoryCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  stories: Story[];
  refreshing: boolean;
  onRefresh: () => void;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onNewStory: () => void;
  onImportStory: () => void;
  onOpenChapter: (id: string, index: number) => void;
  onAddChapter: (id: string) => void;
  onEditInfo: (id: string) => void;
  onDelete: (story: Story) => void;
  bottomInset: number;
};

export function StudioHub({
  stories,
  refreshing,
  onRefresh,
  expandedId,
  onToggle,
  onNewStory,
  onImportStory,
  onOpenChapter,
  onAddChapter,
  onEditInfo,
  onDelete,
  bottomInset,
}: Props) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const { numColumns } = useResponsiveGrid();
  const {top} = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item }: { item: Story }) => (
      <View
        style={
          numColumns > 1
            ? { paddingHorizontal: Spacing.gutter / 2, marginBottom: Spacing.md + 2 }
            : { marginBottom: Spacing.md + 2 }
        }
      >
        <StudioStoryCard
          story={item}
          expanded={expandedId === item.id}
          onToggle={() => onToggle(item.id)}
          onOpenChapter={(i) => onOpenChapter(item.id, i)}
          onAddChapter={() => onAddChapter(item.id)}
          onEditInfo={() => onEditInfo(item.id)}
          onDelete={() => onDelete(item)}
        />
      </View>
    ),
    [numColumns, expandedId, onToggle, onOpenChapter, onAddChapter, onEditInfo, onDelete]
  );

  const header = (
    <View style={{paddingTop: top}}>
      <Text variant="title" style={{ marginBottom: 4 }}>
        {t('studio.hubTitle')}
      </Text>
      <Text
        variant="body"
        tone="textSecondary"
        style={{ marginBottom: Spacing.xl }}
      >
        {t('studio.hubSubtitle')}
      </Text>

      <Pressable
        onPress={onNewStory}
        style={[
          styles.cta,
          { backgroundColor: colors.primarySoft, borderColor: colors.primary },
        ]}
      >
        <View
          style={[
            styles.ctaIcon,
            shadows.bloom,
            { backgroundColor: colors.bloom },
          ]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading" style={{ fontSize: 16.5 }}>
            {t('studio.newStoryCta')}
          </Text>
          <Text variant="caption" tone="textSecondary" style={{ marginTop: 2 }}>
            {t('studio.newStoryCtaSub')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>

      {/* <Pressable
        onPress={onImportStory}
        style={[
          styles.cta,
          { backgroundColor: colors.surfaceVariant, borderColor: colors.border, marginTop: Spacing.sm },
        ]}
      >
        <View
          style={[
            styles.ctaIcon,
            { backgroundColor: colors.surface },
          ]}
        >
          <Ionicons name="download-outline" size={20} color={colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading" style={{ fontSize: 16.5 }}>
            Hikâyeni Taşı
          </Text>
          <Text variant="caption" tone="textSecondary" style={{ marginTop: 2 }}>
            Wattpad&apos;den tek seferde yapıştır, otomatik bölümlere ayrılsın
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable> */}

      {stories.length > 0 && (
        <View style={styles.sectionRow}>
          <View style={[styles.tick, { backgroundColor: colors.bloom }]} />
          <Text variant="heading" style={{ fontSize: 20 }}>
            {t('studio.yourStories')}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FlashList
      key={`grid-${numColumns}`}
      data={stories}
      keyExtractor={(s) => s.id}
      numColumns={numColumns}
      ListHeaderComponent={header}
      contentContainerStyle={{
        paddingHorizontal: Spacing.screenX,
        paddingTop: Spacing.sm,
        paddingBottom: bottomInset + Spacing.xxl,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons
            name="document-text-outline"
            size={44}
            color={colors.textLight}
          />
          <Text variant="subheading" style={{ marginTop: Spacing.md }}>
            {t('studio.noStoriesYet')}
          </Text>
          <Text
            variant="body"
            tone="textSecondary"
            center
            style={{ marginTop: 4 }}
          >
            {t('studio.noStoriesHint')}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md + 2,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  tick: { width: 5, height: 20, borderRadius: Radius.pill },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
});
