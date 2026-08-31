import { storyActions } from '@/store/storyStore';
import { useTheme } from '@/constants/theme';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/features/story/utils/time';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconButton, Screen } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';

export default function OfflineLibraryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const offlineStories = useAppSelector(s => s.story.offlineStories);

  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, count: 0 });

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadStorageInfo();
    storyActions.loadOfflineStories();
  }, []);

  const loadStorageInfo = async () => {
    const info = await storyActions.getOfflineStorageInfo();
    setStorageInfo(info);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await storyActions.loadOfflineStories();
    await loadStorageInfo();
    setRefreshing(false);
  };

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}?offline=true`);
  };

  const handleDeleteStory = (storyId: string, storyTitle: string) => {
    Alert.alert(
      t('studio.deleteStoryTitle'),
      t('offlineLibrary.deleteConfirm', { title: storyTitle }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await storyActions.deleteOfflineStory(storyId);
            if (success) {
              await loadStorageInfo();
            } else {
              Alert.alert(t('common.error'), t('offlineLibrary.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('offlineLibrary.clearAllTitle'),
      t('offlineLibrary.clearAllConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('offlineLibrary.deleteAll'),
          style: 'destructive',
          onPress: async () => {
            const success = await storyActions.clearAllOfflineData();
            if (success) {
              Alert.alert(t('common.success'), t('offlineLibrary.allDeleted'));
              await loadStorageInfo();
            } else {
              Alert.alert(t('common.error'), t('offlineLibrary.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (sizeInKB: number): string => {
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    }
    const sizeInMB = sizeInKB / 1024;
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const renderStoryCard = (story: Story & { downloadedAt?: Date; size?: number }) => {
    return (
      <TouchableOpacity
        key={story.id}
        style={styles.storyCard}
        onPress={() => handleStoryPress(story.id)}
      >
        {story.coverImage && (
          <Image
            source={{ uri: story.coverImage }}
            style={styles.coverImage}
            contentFit="cover"
          />
        )}

        <View style={styles.storyInfo}>
          <View style={styles.storyHeader}>
            <Text style={styles.storyTitle} numberOfLines={2}>
              {story.title}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteStory(story.id, story.title)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.authorName}>{story.author?.displayName || t('common.anonymous')}</Text>
          
          <View style={styles.storyMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="download-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {story.downloadedAt ? formatRelativeTime(story.downloadedAt) : t('offlineLibrary.unknown')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="document-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {formatFileSize(story.size || 0)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{t('time.minutesShort', { count: story.readingTime || 5 })}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-back" iconSize={24} glass onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{t('profileScreen.offlineLibrary')}</Text>
        <TouchableOpacity 
          style={styles.clearAllButton}
          onPress={handleClearAll}
          disabled={offlineStories.length === 0}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color={offlineStories.length > 0 ? colors.textSecondary : colors.border} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.storageInfo}>
        <View style={styles.storageHeader}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
          <Text style={styles.storageTitle}>{t('offlineLibrary.storageInfo')}</Text>
        </View>
        
        <View style={styles.storageStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{storageInfo.count}</Text>
            <Text style={styles.statLabel}>{t('common.story')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatFileSize(storageInfo.used)}</Text>
            <Text style={styles.statLabel}>{t('offlineLibrary.used')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatFileSize(storageInfo.total)}</Text>
            <Text style={styles.statLabel}>{t('offlineLibrary.total')}</Text>
          </View>
        </View>

        <View style={styles.storageBar}>
          <View 
            style={[
              styles.storageBarFill, 
              { width: `${Math.min(100, (storageInfo.used / storageInfo.total) * 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.storagePercent}>
          {t('offlineLibrary.percentUsed', { percent: Math.round((storageInfo.used / storageInfo.total) * 100) })}
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {offlineStories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>{t('offlineLibrary.emptyTitle')}</Text>
            <Text style={styles.emptyStateMessage}>
              {t('offlineLibrary.emptyMessage')}
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.exploreButtonText}>{t('favorites.exploreButton')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.storiesList}>
            {offlineStories.map(story => renderStoryCard(story))}
          </View>
        )}
      </ScrollView>
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
    headerTitle: {
      fontSize: 20, lineHeight: 26,
      fontWeight: '600',
      color: colors.text,
    },
    clearAllButton: {
      padding: 4,
    },
    storageInfo: {
      margin: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    storageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    storageTitle: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
    },
    storageStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18, lineHeight: 23,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12, lineHeight: 16,
      color: colors.textSecondary,
    },
    storageBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 8,
    },
    storageBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    storagePercent: {
      fontSize: 12, lineHeight: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    storiesList: {
      paddingHorizontal: 20,
    },
    storyCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coverImage: {
      width: 60,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
    },
    storyInfo: {
      flex: 1,
    },
    storyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    storyTitle: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    deleteButton: {
      padding: 4,
    },
    authorName: {
      fontSize: 14, lineHeight: 18,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    storyMeta: {
      flexDirection: 'row',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 11, lineHeight: 14,
      color: colors.textSecondary,
    },
    emptyState: {
      paddingVertical: 80,
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyStateTitle: {
      fontSize: 20, lineHeight: 26,
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
      borderRadius: 25,
    },
    exploreButtonText: {
      color: colors.surface,
      fontSize: 15, lineHeight: 20,
      fontWeight: '600',
    },
  });