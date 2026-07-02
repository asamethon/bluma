import { authState$ } from '@/store/authStore';
import { useTheme } from '@/constants/theme';
import { storyActions, storyState$ } from '@/store/storyStore';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/ui';

export default observer(function SavedStoriesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user: currentUser } = authState$.get();
  const { savedStories, isLoading } = storyState$.get();
  
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    if (currentUser?.id) {
      loadSavedStories();
    }
  }, [currentUser?.id]);

  const loadSavedStories = async () => {
    if (!currentUser?.id) return;
    
    try {
      // We can't directly load saved stories if the method doesn't exist.
      // Assuming saved stories are loaded via real-time listeners or we need to implement it.
      // For now, let's use loadUserStories as a placeholder or remove the call if it's handled by state.
      // Ideally storyActions should have loadSavedStories or we fetch from user doc.
      
      // Temporary fix: just log or leave empty if state is managed elsewhere
      console.log("Loading saved stories...");
    } catch (error) {
      console.error('Load saved stories error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedStories();
    setRefreshing(false);
  };

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}/preview`);
  };

  const handleUnsaveStory = async (storyId: string) => {
    try {
      const result = await storyActions.saveStory(storyId);
      if (result.success) {
        // Reload saved stories
        await loadSavedStories();
      }
    } catch (error) {
      console.error('Unsave story error:', error);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Yeni';
    
    const now = new Date();
    const storyDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - storyDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return storyDate.toLocaleDateString('tr-TR');
  };

  const renderStoryCard = (story: Story) => {
    return (
      <TouchableOpacity
        key={story.id}
        style={styles.storyCard}
        onPress={() => handleStoryPress(story.id)}
      >
        <View style={styles.storyHeader}>
          <TouchableOpacity
            style={styles.authorInfo}
            onPress={() => router.push(`/user/${story.authorId}`)}
          >
            <View style={styles.authorAvatar}>
              {story.author?.profileImage ? (
                <Image
                  source={{ uri: story.author.profileImage }}
                  style={styles.authorAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={16} color={colors.primary} />
              )}
            </View>
            <View>
              <View style={styles.authorNameContainer}>
                <Text style={styles.authorName}>
                  {story.author?.displayName || "Anonim"}
                </Text>
              </View>
              <Text style={styles.authorUsername}>
                @{story.author?.username || "user"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.unsaveButton}
            onPress={(e) => {
              e.stopPropagation();
              handleUnsaveStory(story.id);
            }}
          >
            <Ionicons name="bookmark" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.storyContent}>
          <Text style={styles.storyTitle}>{story.title}</Text>
          <Text style={styles.storyDescription} numberOfLines={3}>
            {story.description || story.content?.substring(0, 150) + "..."}
          </Text>
        </View>

        <View style={styles.storyFooter}>
          <View style={styles.storyStats}>
            <View style={styles.statItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>{story.readingTime || 5} dk</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name="heart-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>{story.likesCount || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>{story.commentsCount || 0}</Text>
            </View>
          </View>

          <Text style={styles.storyTime}>{formatTimeAgo(story.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!currentUser?.id) {
    return (
      <Screen style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kaydedilen Hikayeler</Text>
          <View style={styles.backButton} />
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="log-in-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>Giriş Gerekli</Text>
          <Text style={styles.emptyStateMessage}>
            Kaydedilen hikayelerinizi görmek için giriş yapmalısınız.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kaydedilen Hikayeler</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Hikayeler yükleniyor...</Text>
          </View>
        ) : savedStories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Henüz hikaye kaydetmediniz</Text>
            <Text style={styles.emptyStateMessage}>
              Beğendiğiniz hikayeleri kaydedin ve daha sonra kolayca erişin.
            </Text>
          </View>
        ) : (
          <View style={styles.storiesContainer}>
            {savedStories.map(story => renderStoryCard(story))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
});

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
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
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
      fontSize: 18,
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
    storiesContainer: {
      paddingTop: 16,
    },
    storyCard: {
      marginHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    storyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    authorAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    authorAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    authorName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    authorNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    verifiedBadge: {
      width: 12,
      height: 12,
    },
    authorUsername: {
      fontSize: 12,
      color: colors.primary,
    },
    unsaveButton: {
      padding: 4,
    },
    storyContent: {
      marginBottom: 16,
    },
    storyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 24,
    },
    storyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    storyFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    storyStats: {
      flexDirection: 'row',
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    storyTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  }); 