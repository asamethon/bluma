import { IconButton, PageHeader, Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useOfflineLibrary } from '@/features/profile/hooks/useOfflineLibrary';
import { createOfflineLibraryStyles } from '@/features/profile/styles/offlineLibraryStyles';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl } from 'react-native';
import { OfflineLibraryEmpty } from './OfflineLibraryEmpty';
import { OfflineStorageSummary } from './OfflineStorageSummary';
import { OfflineStory, OfflineStoryRow } from './OfflineStoryRow';

export function OfflineLibraryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const stories = useAppSelector(state => state.story.offlineStories);
  const library = useOfflineLibrary();
  const styles = useMemo(() => createOfflineLibraryStyles(colors), [colors]);
  const open = useCallback((id: string) => router.push(`/story/${id}?offline=true` as never), [router]);
  const explore = useCallback(() => router.push('/(tabs)'), [router]);
  const renderStory = useCallback(({ item }: { item: OfflineStory }) => (
    <OfflineStoryRow story={item} styles={styles} onOpen={open} onRemove={library.remove} />
  ), [library.remove, open, styles]);
  return (
    <Screen style={styles.container}>
      <PageHeader
        title={t('profileScreen.offlineLibrary')}
        onBack={router.back}
        right={(
          <IconButton
            icon="trash-outline"
            size={38}
            iconSize={22}
            color={colors.textSecondary}
            disabled={!stories.length}
            accessibilityLabel={t('common.delete')}
            onPress={library.clear}
          />
        )}
      />
      <OfflineStorageSummary storage={library.storage} styles={styles} />
      <FlatList
        data={stories}
        keyExtractor={story => story.id}
        renderItem={renderStory}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={library.refreshing} onRefresh={library.refresh} />}
        ListEmptyComponent={<OfflineLibraryEmpty styles={styles} onExplore={explore} />}
      />
    </Screen>
  );
}
