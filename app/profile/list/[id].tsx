import { Screen, StoryRow, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { readingListActions } from '@/store/readingListStore';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

export default function ReadingListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const lists = useAppSelector(s => s.readingList.lists);
  const list = lists.find(l => l.id === id);

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!id) return;
    const s = await readingListActions.getListStories(id);
    setStories(s);
    setLoading(false);
  };

  useEffect(() => {
    if (store.getState().readingList.lists.length === 0) readingListActions.loadLists().then(load);
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, list?.storyIds.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const removeStory = useCallback((storyId: string, title: string) => {
    Alert.alert(t('lists.removeTitle'), t('lists.removeConfirm', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('lists.remove'),
        style: 'destructive',
        onPress: async () => {
          await readingListActions.removeStory(id!, storyId);
          setStories(prev => prev.filter(s => s.id !== storyId));
        },
      },
    ]);
  }, [id, t]);

  const renderItem = useCallback(
    ({ item }: { item: Story }) => (
      <StoryRow
        story={item}
        status={item.isCompleted ? 'completed' : null}
        onPress={() => router.push(`/story/${item.id}/preview`)}
        onMenu={() => removeStory(item.id, item.title)}
      />
    ),
    [router, removeStory]
  );

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="subheading" numberOfLines={1} style={{ fontWeight: '700' }}>
            {list?.name || t('lists.list')}
          </Text>
          <Text variant="caption" tone="textSecondary">{t('lists.storyCount', { count: stories.length })}</Text>
        </View>
      </View>

      <FlashList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 120, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={44} color={colors.primaryLight} />
              <Text variant="body" tone="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
                {t('lists.emptyListHint')}
              </Text>
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 6, width: 40, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
});
