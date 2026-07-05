import { GuestState } from '@/components/GuestState';
import {
  BloomMark,
  SectionHeader,
  StoryRow,
  Text,
} from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { storyActions } from '@/store/storyStore';
import { Story } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';

interface LibrarySection {
  title: string;
  accent: string;
  data: Story[];
}

export default function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isGuest } = useAppSelector(s => s.auth);
  const { savedStories, likedStories } = useAppSelector(s => s.story);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        storyActions.initializeRealTimeListeners();
      }
    }, [currentUser?.id])
  );

  const onRefresh = useCallback(async () => {
    if (!currentUser?.id) return;
    setRefreshing(true);
    try {
      await Promise.all([
        storyActions.loadSavedStories(),
        storyActions.loadLikedStories(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser?.id]);

  if (isGuest) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text variant="title">Kütüphanem</Text>
        </View>
        <GuestState kind="library" />
      </View>
    );
  }

  const isEmpty = (!savedStories || savedStories.length === 0) && (!likedStories || likedStories.length === 0);

  // savedStories büyüyebilir (kayıt sınırı yok) — ScrollView+.map() yerine
  // SectionList kullanılır (bkz. docs/ARCHITECTURE.md performans ilkeleri).
  const sections: LibrarySection[] = useMemo(() => {
    const list: LibrarySection[] = [];
    if (savedStories && savedStories.length > 0) {
      list.push({ title: 'Kaydedilenler', accent: colors.secondary, data: savedStories });
    }
    if (likedStories && likedStories.length > 0) {
      list.push({ title: 'Beğendiklerim', accent: colors.bloom, data: likedStories.slice(0, 10) });
    }
    return list;
  }, [savedStories, likedStories, colors.secondary, colors.bloom]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SectionList
        sections={sections}
        keyExtractor={(story) => story.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.bloom}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="title">Kütüphanem</Text>
          </View>
        }
        ListEmptyComponent={
          isEmpty ? (
            <View style={styles.empty}>
              <BloomMark size={64} color={colors.primaryLight} coreColor={colors.bloomLight} />
              <Text variant="heading" center style={{ marginTop: Spacing.xl }}>
                Kütüphanen henüz boş
              </Text>
              <Text variant="body" tone="textSecondary" center style={{ marginTop: Spacing.sm, maxWidth: 280 }}>
                Beğendiğin hikâyeleri kaydet; hepsi burada seni bekler.
              </Text>
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.section}>
            <SectionHeader title={section.title} accent={section.accent} />
          </View>
        )}
        renderItem={({ item: story }) => (
          <View style={styles.rowWrap}>
            <StoryRow
              story={story}
              status={story.isCompleted ? 'Tamamlandı' : 'Devam ediyor'}
              onPress={() => router.push(`/story/${story.id}/preview` as any)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  section: { marginTop: Spacing.xl },
  rowWrap: { paddingHorizontal: Spacing.screenX, marginBottom: Spacing.md },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.huge,
  },
});
