import { useTheme } from '@/constants/theme';
import { SavedStoryCard } from '@/features/story/components/SavedStoryCard';
import { storyActions } from '@/store/storyStore';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Screen } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { logger } from '@/utils/logger';

export default function SavedStoriesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const currentUser = useAppSelector(s => s.auth.user);
  const savedStories = useAppSelector(s => s.story.savedStories);
  const isLoading = useAppSelector(s => s.story.isLoading);

  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const onRefresh = async () => {
    setRefreshing(true);
    await storyActions.loadSavedStories();
    setRefreshing(false);
  };

  const handleStoryPress = useCallback((story: Story) => {
    router.push(`/story/${story.id}/preview`);
  }, [router]);

  const handleAuthorPress = useCallback((story: Story) => {
    router.push(`/user/${story.authorId}`);
  }, [router]);

  const handleUnsaveStory = useCallback(async (story: Story) => {
    try {
      await storyActions.saveStory(story.id);
    } catch (error) {
      logger.error('Unsave story error:', error);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Story }) => (
      <SavedStoryCard
        story={item}
        onPress={handleStoryPress}
        onAuthorPress={handleAuthorPress}
        onUnsave={handleUnsaveStory}
      />
    ),
    [handleStoryPress, handleAuthorPress, handleUnsaveStory]
  );

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('saved.title')}</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (!currentUser?.id) {
    return (
      <Screen style={styles.container}>
        {header}
        <View style={styles.emptyState}>
          <Ionicons name="log-in-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>{t('studio.loginRequiredTitle')}</Text>
          <Text style={styles.emptyStateMessage}>{t('saved.loginMessage')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {header}
      <FlashList
        data={savedStories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('saved.loading')}</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>{t('saved.emptyTitle')}</Text>
              <Text style={styles.emptyStateMessage}>{t('saved.emptyMessage')}</Text>
            </View>
          )
        }
      />
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      width: 40,
    },
    headerTitle: {
      fontSize: 18, lineHeight: 23,
      fontWeight: '600',
      color: colors.text,
    },
    listContent: {
      paddingTop: 16,
      paddingBottom: 120,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16, lineHeight: 21,
      color: colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyStateTitle: {
      fontSize: 18, lineHeight: 23,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
