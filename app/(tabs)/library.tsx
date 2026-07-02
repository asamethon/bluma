import { GuestState } from '@/components/GuestState';
import {
  BloomMark,
  SectionHeader,
  StoryRow,
  Text,
} from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { authState$ } from '@/store/authStore';
import { storyActions, storyState$ } from '@/store/storyStore';
import { Story } from '@/types';
import { observer } from '@legendapp/state/react';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default observer(function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isGuest } = authState$.get();
  const { savedStories, likedStories } = storyState$.get();
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.bloom}
          />
        }
      >
        <View style={styles.header}>
          <Text variant="title">Kütüphanem</Text>
        </View>

        {isEmpty ? (
          <View style={styles.empty}>
            <BloomMark size={64} color={colors.primaryLight} coreColor={colors.bloomLight} />
            <Text variant="heading" center style={{ marginTop: Spacing.xl }}>
              Kütüphanen henüz boş
            </Text>
            <Text variant="body" tone="textSecondary" center style={{ marginTop: Spacing.sm, maxWidth: 280 }}>
              Beğendiğin hikâyeleri kaydet; hepsi burada seni bekler.
            </Text>
          </View>
        ) : (
          <>
            {savedStories && savedStories.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Kaydedilenler" accent={colors.secondary} />
                <View style={{ paddingHorizontal: Spacing.screenX, gap: Spacing.md }}>
                  {savedStories.map((story: Story) => (
                    <StoryRow
                      key={story.id}
                      story={story}
                      status={story.isCompleted ? 'Tamamlandı' : 'Devam ediyor'}
                      onPress={() => router.push(`/story/${story.id}/preview` as any)}
                    />
                  ))}
                </View>
              </View>
            )}

            {likedStories && likedStories.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Beğendiklerim" accent={colors.bloom} />
                <View style={{ paddingHorizontal: Spacing.screenX, gap: Spacing.md }}>
                  {likedStories.slice(0, 10).map((story: Story) => (
                    <StoryRow
                      key={story.id}
                      story={story}
                      status={story.isCompleted ? 'Tamamlandı' : 'Devam ediyor'}
                      onPress={() => router.push(`/story/${story.id}/preview` as any)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  section: { marginTop: Spacing.xl },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.huge,
  },
});
