import { IconButton, Screen, StoryRow, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { useReadingListDetail } from '@/features/library/hooks/useReadingListDetail';
import { readingListStyles as styles } from '@/features/library/styles/readingListStyles';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

export default function ReadingListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const model = useReadingListDetail(id ?? '');

  return (
    <Screen style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" iconSize={24} onPress={() => router.back()} />
        <View style={styles.listBody}>
          <Text variant="subheading" numberOfLines={1} style={styles.headerTitle}>
            {model.list?.name || t('lists.list')}
          </Text>
          <Text variant="caption" tone="textSecondary">
            {t('lists.storyCount', { count: model.stories.length })}
          </Text>
        </View>
      </View>

      <FlashList
        data={model.stories}
        keyExtractor={story => story.id}
        contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={model.refreshing} onRefresh={model.onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          model.loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={44} color={colors.primaryLight} />
              <Text variant="body" tone="textSecondary" style={styles.emptyText}>
                {t('lists.emptyListHint')}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: Spacing.md }}>
            <StoryRow
              story={item}
              status={item.isCompleted ? 'completed' : null}
              onPress={() => router.push(`/story/${item.id}/preview`)}
              onMenu={() => model.confirmRemove(item.id, item.title)}
            />
          </View>
        )}
      />
    </Screen>
  );
}
