import OfflineIndicator from '@/components/ui/OfflineIndicator';
import { BloomMark, Screen, SectionHeader, SkeletonRow, Text } from '@/components/ui';
import { CategoryMeta, useTheme } from '@/constants/theme';
import { useSectionImpressions } from '@/features/discovery/hooks/useSectionImpressions';
import { useResponsiveGrid } from '@/hooks/useResponsive';
import type { Story } from '@/types';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View } from 'react-native';
import { useCategoryFeed } from '../hooks/useCategoryFeed';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { useHomeSections } from '../hooks/useHomeSections';
import type { HomeSection } from '../services/homeSections';
import { createHomeStyles } from '../styles/homeStyles';
import { HomeHeader } from './HomeHeader';
import { HomeSectionView } from './HomeSectionView';
import { HomeStoryGridItem } from './HomeStoryGridItem';
import { HomeWriterNudge } from './HomeWriterNudge';

/** Tür seçili değilken satırlar bölümdür; seçiliyken o türün hikâyeleri. */
type HomeListItem = { kind: 'section'; section: HomeSection } | { kind: 'story'; story: Story };

const itemKey = (item: HomeListItem) => (item.kind === 'section' ? item.section.key : item.story.id);
const itemType = (item: HomeListItem) => (item.kind === 'section' ? `section-${item.section.layout}` : 'story');
/** Bölümler tablette de tam genişlik; ızgara yalnızca tür listesinde. */
const spanSections = (layout: { span?: number }, item: HomeListItem, _index: number, maxColumns: number) => {
  if (item.kind === 'section') layout.span = maxColumns;
};

export function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const feed = useHomeFeed();
  const category = useCategoryFeed(feed.stories);
  const sections = useHomeSections(feed.stories, feed.following, feed.isGuest);
  const impressions = useSectionImpressions();
  const { numColumns } = useResponsiveGrid();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const items = useMemo<HomeListItem[]>(() => (category.stories
    ? category.stories.map(story => ({ kind: 'story' as const, story }))
    : sections.map(section => ({ kind: 'section' as const, section }))), [category.stories, sections]);
  const renderItem = useCallback<ListRenderItem<HomeListItem>>(({ item, index }) => (
    item.kind === 'section'
      ? <HomeSectionView section={item.section} />
      : <HomeStoryGridItem story={item.story} position={index} grid={numColumns > 1} />
  ), [numColumns]);
  const selectedTitle = category.category && CategoryMeta[category.category]
    ? t(CategoryMeta[category.category].label)
    : category.category;
  const showEmpty = category.stories ? category.stories.length === 0 : feed.stories.length === 0;

  return (
    <Screen edges={[]} style={styles.container}>
      <OfflineIndicator showWhenOnline />
      <FlashList
        key={`grid-${numColumns}`}
        data={items}
        keyExtractor={itemKey}
        getItemType={itemType}
        numColumns={numColumns}
        overrideItemLayout={spanSections}
        renderItem={renderItem}
        viewabilityConfig={impressions.viewabilityConfig}
        onViewableItemsChanged={impressions.onViewableItemsChanged}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={numColumns > 1 ? styles.gridContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} tintColor={colors.bloom} />}
        ListHeaderComponent={
          <>
            <HomeHeader
              user={feed.currentUser}
              guest={feed.isGuest}
              network={feed.network}
              offlineCount={feed.offlineCount}
              selectedCategory={category.category}
              onSelectCategory={category.select}
            />
            {category.category ? (
              <View style={styles.section}>
                <SectionHeader title={selectedTitle || ''} />
              </View>
            ) : (
              <HomeWriterNudge />
            )}
          </>
        }
        onEndReached={category.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={category.loadingMore ? (
          <View style={styles.loadMore}>
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : null}
        ListEmptyComponent={showEmpty ? (
          <View style={styles.empty}>
            <BloomMark size={category.stories ? 64 : 52} color={colors.primaryLight} coreColor={colors.bloomLight} />
            {!category.stories && <Text variant="titleSm" center style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>}
            <Text variant="body" tone="textSecondary" center style={styles.emptySubtitle}>
              {category.stories ? t('home.noStoriesInGenre') : t('home.emptySub')}
            </Text>
          </View>
        ) : null}
      />
    </Screen>
  );
}
