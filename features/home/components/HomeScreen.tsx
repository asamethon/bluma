import OfflineIndicator from '@/components/ui/OfflineIndicator';
import { BloomMark, Chip, Screen, SectionHeader, SkeletonRow, Text } from '@/components/ui';
import { CategoryMeta, useTheme } from '@/constants/theme';
import { useSectionImpressions } from '@/features/discovery/hooks/useSectionImpressions';
import { useResponsiveGrid } from '@/hooks/useResponsive';
import { useAppSelector } from '@/store/hooks';
import type { Story } from '@/types';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View } from 'react-native';
import { useCategoryFeed } from '../hooks/useCategoryFeed';
import { useEndlessFeed } from '../hooks/useEndlessFeed';
import { CATEGORY_SORTS } from '../services/categoryRanking';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { useHomeSections } from '../hooks/useHomeSections';
import type { HomeSection } from '../services/homeSections';
import { createHomeStyles } from '../styles/homeStyles';
import { HomeHeader } from './HomeHeader';
import { HomeSectionView } from './HomeSectionView';
import { HomeStoryGridItem } from './HomeStoryGridItem';
import { HomeWriterNudge } from './HomeWriterNudge';

/**
 * Tür seçili değilken liste önce kişisel bölümlerden, sonra tür raflarından
 * geçer ve "Bütün Hikâyeler" kuyruğuna girer; dibe inildikçe katalogdan sayfa
 * sayfa büyür — ana sayfanın sonu yoktur. Tür seçiliyken yalnızca o türün
 * hikâyeleri listelenir.
 */
type HomeListItem =
  | { kind: 'section'; section: HomeSection }
  | { kind: 'label'; id: string; title: string }
  | { kind: 'story'; story: Story; position: number };

const itemKey = (item: HomeListItem) => {
  if (item.kind === 'section') return item.section.rowKey;
  return item.kind === 'label' ? `label:${item.id}` : item.story.id;
};
const itemType = (item: HomeListItem) => (item.kind === 'section' ? `section-${item.section.layout}` : item.kind);
/** Bölüm ve ara başlık tablette de tam genişlik; ızgara yalnızca hikâye kartlarında. */
const spanRows = (layout: { span?: number }, item: HomeListItem, _index: number, maxColumns: number) => {
  if (item.kind !== 'story') layout.span = maxColumns;
};

export function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const feed = useHomeFeed();
  const category = useCategoryFeed(feed.stories);
  const home = useHomeSections(feed.stories, feed.following, feed.isGuest);
  const endless = useEndlessFeed();
  const impressions = useSectionImpressions();
  const { numColumns } = useResponsiveGrid();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const intent = useAppSelector(s => s.auth.user?.intent);
  const items = useMemo<HomeListItem[]>(() => {
    if (category.stories) {
      return category.stories.map((story, position) => ({ kind: 'story' as const, story, position }));
    }
    const rows: HomeListItem[] = [];
    home.sections.forEach((section, index) => {
      // Tür raflarının başında tek bir "Türler" künyesi durur.
      if (section.layout === 'category' && home.sections[index - 1]?.layout !== 'category') {
        rows.push({ kind: 'label', id: 'categories', title: t('home.categories') });
      }
      rows.push({ kind: 'section', section });
    });
    if (home.rest.length) rows.push({ kind: 'label', id: 'all', title: t('home.allStories') });
    home.rest.forEach((story, position) => rows.push({ kind: 'story', story, position }));
    return rows;
  }, [category.stories, home.rest, home.sections, t]);
  const renderItem = useCallback<ListRenderItem<HomeListItem>>(({ item }) => {
    if (item.kind === 'section') return <HomeSectionView section={item.section} onSelectCategory={category.select} />;
    if (item.kind === 'label') {
      return <View style={styles.section}><SectionHeader title={item.title} /></View>;
    }
    return (
      <HomeStoryGridItem
        story={item.story}
        position={item.position}
        grid={numColumns > 1}
        source={category.stories ? 'category' : 'all_stories'}
      />
    );
  }, [category.select, category.stories, numColumns, styles.section]);
  const selectedTitle = category.category && CategoryMeta[category.category]
    ? t(CategoryMeta[category.category].label)
    : category.category;
  const showEmpty = category.stories ? category.stories.length === 0 : feed.stories.length === 0;

  return (
    <Screen edges={[]} style={styles.container}>
      <OfflineIndicator showWhenOnline />
      <FlashList
        /* Tür değişince liste BAŞTAN kurulur: aksi hâlde yeni türe, önceki
           listede kalınan kaydırma konumundan giriliyordu. */
        key={`grid-${numColumns}-${category.category ?? 'home'}`}
        data={items}
        keyExtractor={itemKey}
        getItemType={itemType}
        numColumns={numColumns}
        overrideItemLayout={spanRows}
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
                {/* Tür sayfasında sıralama: Popüler (günlük hız) · Yükselen (yeni + hız) · Yeni */}
                <View style={styles.sortRow}>
                  {CATEGORY_SORTS.map(sort => (
                    <Chip
                      key={sort}
                      label={t(`home.sort_${sort}`)}
                      active={category.sort === sort}
                      shape="pill"
                      onPress={() => category.setSort(sort)}
                    />
                  ))}
                </View>
              </View>
            ) : (
              intent !== 'reader' ? <HomeWriterNudge /> : null
            )}
          </>
        }
        onEndReached={endless.loadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={endless.loadingMore ? (
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
