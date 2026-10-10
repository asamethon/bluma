import { EmptyState } from "@/components/ui";
import { Spacing, useTheme } from "@/constants/theme";
import { useResponsiveGrid } from "@/hooks/useResponsive";
import { Story } from "@/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";
import { FlashList } from '@shopify/flash-list';
import { StudioStoryCard } from "./StudioStoryCard";
import { StudioHubHeader } from "./StudioHubHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  stories: Story[];
  refreshing: boolean;
  onRefresh: () => void;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onNewStory: () => void;
  onOpenChapter: (id: string, index: number) => void;
  onAddChapter: (id: string) => void;
  onEditInfo: (id: string) => void;
  onLaunch: (id: string) => void;
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
  onOpenChapter,
  onAddChapter,
  onEditInfo,
  onLaunch,
  onDelete,
  bottomInset,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { numColumns } = useResponsiveGrid();
  const {top} = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item }: { item: Story }) => (
      <View
        style={
          numColumns > 1
            ? { paddingHorizontal: Spacing.gutter / 2, marginBottom: Spacing.md }
            : undefined
        }
      >
        <StudioStoryCard
          story={item}
          expanded={expandedId === item.id}
          onToggle={() => onToggle(item.id)}
          onOpenChapter={(i) => onOpenChapter(item.id, i)}
          onAddChapter={() => onAddChapter(item.id)}
          onEditInfo={() => onEditInfo(item.id)}
          onLaunch={() => onLaunch(item.id)}
          onDelete={() => onDelete(item)}
        />
      </View>
    ),
    [numColumns, expandedId, onToggle, onOpenChapter, onAddChapter, onEditInfo, onLaunch, onDelete]
  );

  return (
    <FlashList
      key={`grid-${numColumns}`}
      data={stories}
      keyExtractor={(s) => s.id}
      numColumns={numColumns}
      ListHeaderComponent={
        <StudioHubHeader topInset={top} hasStories={stories.length > 0} onNewStory={onNewStory} />
      }
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
        <EmptyState
          icon="document-text-outline"
          title={t('studio.noStoriesYet')}
          description={t('studio.noStoriesHint')}
        />
      }
    />
  );
}
