import { Screen, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { trackSearchClick } from '@/features/discovery/services/feedEvents';
import { SearchListHeader } from '@/features/search/components/SearchListHeader';
import { SearchStoryRow } from '@/features/search/components/SearchStoryRow';
import { useSearch } from '@/features/search/hooks/useSearch';
import { searchStyles as styles } from '@/features/search/styles/searchStyles';
import type { SearchHistoryItem } from '@/features/search/types';
import { useResponsiveGrid } from '@/hooks/useResponsive';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { numColumns } = useResponsiveGrid();
  const router = useRouter();
  const search = useSearch();

  const queryLength = search.query.trim().length;
  const openStory = useCallback((story: Story, position: number) => {
    trackSearchClick('story', position, queryLength, story.id);
    search.history.addStory(story);
    router.push(`/story/${story.id}/preview`);
  }, [queryLength, router, search.history]);

  const openUser = useCallback((userId: string, position: number) => {
    trackSearchClick('user', position, queryLength);
    router.push(`/user/${userId}`);
  }, [queryLength, router]);

  const openHistory = useCallback((item: SearchHistoryItem) => {
    if (item.type === 'query') search.setQuery(item.query || '');
    else if (item.type === 'story' && item.id) router.push(`/story/${item.id}/preview`);
    else if (item.type === 'user' && item.id) router.push(`/user/${item.id}`);
  }, [router, search]);

  const renderStory = useCallback(
    ({ item, index }: { item: Story; index: number }) => (
      <SearchStoryRow story={item} position={index} columns={numColumns} onOpen={openStory} />
    ),
    [numColumns, openStory],
  );

  const header = (
    <SearchListHeader
      topInset={top}
      query={search.query}
      genre={search.genre}
      idle={search.idle}
      busy={search.busy}
      resultCount={search.visibleStories.length}
      users={search.users}
      history={search.history.items}
      onQueryChange={search.setQuery}
      onGenreChange={search.setGenre}
      onSubmitQuery={search.submitQuery}
      onClearHistory={search.history.clear}
      onOpenHistory={openHistory}
      onRemoveHistory={search.history.remove}
      onOpenUser={openUser}
    />
  );

  const empty = !search.busy && search.empty && !search.idle ? (
    <View style={styles.empty}>
      <Ionicons name="leaf-outline" size={38} color={colors.primaryLight} />
      <Text variant="body" tone="textSecondary" style={styles.emptyText}>
        {t('search.emptyResults')}
      </Text>
    </View>
  ) : null;

  return (
    <Screen edges={[]} style={{ flex: 1, backgroundColor: colors.background }}>
      <FlashList
        key={`grid-${numColumns}`}
        data={search.busy ? [] : search.visibleStories}
        keyExtractor={story => story.id}
        numColumns={numColumns}
        renderItem={renderStory}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: numColumns > 1 ? Spacing.screenX : 0,
        }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />
    </Screen>
  );
}
