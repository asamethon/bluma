import { Screen, StoryRow, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { readingListActions } from '@/store/readingListStore';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReadingListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
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
    // İlk açılışta listeler henüz yüklenmemişse önce onları çek (reaktif
    // olmayan tek seferlik okuma — effect'i lists'e bağlamamak için getState).
    if (store.getState().readingList.lists.length === 0) readingListActions.loadLists().then(load);
    else load();
    // storyIds değişince (ekle/çıkar) yeniden yükle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, list?.storyIds.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const removeStory = (storyId: string, title: string) => {
    Alert.alert('Listeden çıkar', `"${title}" bu listeden çıkarılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkar',
        style: 'destructive',
        onPress: async () => {
          await readingListActions.removeStory(id!, storyId);
          setStories(prev => prev.filter(s => s.id !== storyId));
        },
      },
    ]);
  };

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="subheading" numberOfLines={1} style={{ fontWeight: '700' }}>
            {list?.name || 'Liste'}
          </Text>
          <Text variant="caption" tone="textSecondary">{stories.length} hikâye</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 120, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
        ) : stories.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={44} color={colors.primaryLight} />
            <Text variant="body" tone="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
              Bu liste henüz boş. Bir hikâyeyi okurken “Listeye ekle” ile buraya ekleyebilirsin.
            </Text>
          </View>
        ) : (
          stories.map(story => (
            <StoryRow
              key={story.id}
              story={story}
              status={story.isCompleted ? 'Tamamlandı' : null}
              onPress={() => router.push(`/story/${story.id}/preview`)}
              onMenu={() => removeStory(story.id, story.title)}
            />
          ))
        )}
      </ScrollView>
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
