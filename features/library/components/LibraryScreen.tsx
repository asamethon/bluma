import { SectionHeader, StoryRow, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { GuestState } from '@/features/auth/components/guest/GuestState';
import { useLibrary, type LibrarySection } from '@/features/library/hooks/useLibrary';
import { libraryStyles as styles } from '@/features/library/styles/libraryStyles';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LibraryEmpty } from './LibraryEmpty';

export default function LibraryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const isGuest = useAppSelector(state => state.auth.isGuest);
  const { sections, refreshing, onRefresh } = useLibrary();

  const header = (
    <View style={[styles.header, { paddingTop: top + Spacing.lg }]}>
      <Text variant="display" numberOfLines={1}>{t('library.title')}</Text>
    </View>
  );

  if (isGuest) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {header}
        <GuestState kind="library" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={story => story.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.bloom} />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={<LibraryEmpty />}
        renderSectionHeader={({ section }: { section: LibrarySection }) => (
          <View>
            <SectionHeader title={section.title} />
          </View>
        )}
        renderItem={({ item: story }) => (
          <StoryRow
            story={story}
            status={story.isCompleted ? 'completed' : 'ongoing'}
            style={styles.rowWrap}
            onPress={() => router.push(`/story/${story.id}/preview`)}
          />
        )}
        initialNumToRender={6}
        windowSize={11}
      />
    </View>
  );
}
