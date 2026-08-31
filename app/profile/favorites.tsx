import { useTheme } from '@/constants/theme';
import { FavoriteStoryCard } from '@/features/story/components/FavoriteStoryCard';
import { storyActions } from '@/store/storyStore';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { IconButton, Screen } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { logger } from '@/utils/logger';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const currentUser = useAppSelector(s => s.auth.user);
  const likedStories = useAppSelector(s => s.story.likedStories);
  const isLoading = useAppSelector(s => s.story.isLoading);

  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const onRefresh = async () => {
    setRefreshing(true);
    await storyActions.refreshLikedStoriesState();
    setRefreshing(false);
  };

  const handleStoryPress = useCallback((story: Story) => {
    router.push(`/story/${story.id}/preview`);
  }, [router]);

  const handleUnlikeStory = useCallback((story: Story) => {
    Alert.alert(
      t('favorites.removeTitle'),
      t('favorites.removeConfirm', { title: story.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('lists.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await storyActions.likeStory(story.id);
              if (result.success) {
                Alert.alert(t('common.success'), t('favorites.removed'));
              } else {
                Alert.alert(t('common.error'), (result.error as string) || t('favorites.removeFailed'));
              }
            } catch (error) {
              logger.error('Unlike story error:', error);
              Alert.alert(t('common.error'), t('favorites.removeFailed'));
            }
          },
        },
      ]
    );
  }, [t]);

  const renderItem = useCallback(
    ({ item }: { item: Story }) => (
      <FavoriteStoryCard story={item} onPress={handleStoryPress} onUnlike={handleUnlikeStory} />
    ),
    [handleStoryPress, handleUnlikeStory]
  );

  const header = (
    <View style={styles.header}>
      <IconButton icon="arrow-back" iconSize={24} glass onPress={() => router.back()} />
      <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
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
          <Text style={styles.emptyStateMessage}>{t('favorites.loginMessage')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {header}
      <FlashList
        data={likedStories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('favorites.loading')}</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>{t('favorites.emptyTitle')}</Text>
              <Text style={styles.emptyStateMessage}>{t('favorites.emptyMessage')}</Text>
              <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.exploreButtonText}>{t('favorites.exploreButton')}</Text>
              </TouchableOpacity>
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
      marginBottom: 24,
    },
    exploreButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    exploreButtonText: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.white,
    },
  });
