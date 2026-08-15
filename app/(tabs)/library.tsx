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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector(s => s.auth.user);
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const savedStories = useAppSelector(s => s.story.savedStories);
  const likedStories = useAppSelector(s => s.story.likedStories);
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

  const isEmpty = (!savedStories || savedStories.length === 0) && (!likedStories || likedStories.length === 0);

  const renderItem = useCallback(
    ({ item: story }: { item: Story }) => (
      <View style={styles.rowWrap}>
        <StoryRow
          story={story}
          status={story.isCompleted ? 'completed' : 'ongoing'}
          onPress={() => router.push(`/story/${story.id}/preview` as any)}
        />
      </View>
    ),
    [router]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: LibrarySection }) => (
      <View style={styles.section}>
        <SectionHeader title={section.title} accent={section.accent} />
      </View>
    ),
    []
  );

  const sections: LibrarySection[] = useMemo(() => {
    const list: LibrarySection[] = [];
    if (savedStories && savedStories.length > 0) {
      list.push({ title: t('library.saved'), accent: colors.secondary, data: savedStories });
    }
    if (likedStories && likedStories.length > 0) {
      list.push({ title: t('library.liked'), accent: colors.bloom, data: likedStories.slice(0, 10) });
    }
    return list;
  }, [savedStories, likedStories, colors.secondary, colors.bloom, t]);

  if (isGuest) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text variant="title">{t('library.title')}</Text>
        </View>
        <GuestState kind="library" />
      </View>
    );
  }

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
            <Text variant="title">{t('library.title')}</Text>
          </View>
        }
        ListEmptyComponent={
          isEmpty ? (
            <View style={styles.empty}>
              <BloomMark size={64} color={colors.primaryLight} coreColor={colors.bloomLight} />
              <Text variant="heading" center style={{ marginTop: Spacing.xl }}>
                {t('guest.library.title')}
              </Text>
              <Text variant="body" tone="textSecondary" center style={{ marginTop: Spacing.sm, maxWidth: 280 }}>
                {t('library.emptySub')}
              </Text>
            </View>
          ) : null
        }
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        initialNumToRender={6}
        windowSize={11}
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
