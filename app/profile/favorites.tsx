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
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/ui';

export default observer(function FavoritesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user: currentUser } = authState$.get();
  const { likedStories, isLoading } = storyState$.get();
  
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    if (currentUser?.id) {
      loadLikedStories();
    }
  }, [currentUser?.id]);

  const loadLikedStories = async () => {
    if (!currentUser?.id) return;
    
    try {
      // Refresh state if needed, assuming the listener handles updates
      // await storyActions.refreshLikedStoriesState();
    } catch (error) {
      console.error('Load liked stories error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLikedStories();
    setRefreshing(false);
  };

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}/preview`);
  };

  const handleUnlikeStory = async (story: Story) => {
    Alert.alert(
      'Favorilerden Çıkar',
      `"${story.title}" hikayesini favorilerden çıkarmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await storyActions.likeStory(story.id);
              if (result.success) {
                Alert.alert('Başarılı', 'Hikaye favorilerden çıkarıldı.');
                await loadLikedStories();
              } else {
                Alert.alert('Hata', (result.error as string) || 'Hikaye favorilerden çıkarılırken bir hata oluştu.');
              }
            } catch (error) {
              console.error('Unlike story error:', error);
              Alert.alert('Hata', 'Hikaye favorilerden çıkarılırken bir hata oluştu.');
            }
          },
        },
      ]
    );
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
        <View style={styles.storyContent}>
          <View style={styles.storyHeader}>
            <View style={styles.authorInfo}>
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
              <View style={styles.authorDetails}>
                <View style={styles.authorNameContainer}>
                  <Text style={styles.authorName}>
                    {story.author?.displayName || "Anonim"}
                  </Text>
                </View>
                <Text style={styles.authorUsername}>
                  @{story.author?.username || "user"}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.storyTitle}>{story.title}</Text>

          {story.description && (
            <Text style={styles.storyDescription} numberOfLines={2}>
              {story.description}
            </Text>
          )}

          <View style={styles.storyStats}>
            <View style={styles.storyStatItem}>
              <Ionicons name="heart" size={14} color={colors.accent} />
              <Text style={styles.storyStatText}>{story.likesCount || 0}</Text>
            </View>
            <View style={styles.storyStatItem}>
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.storyStatText}>
                {story.commentsCount || 0}
              </Text>
            </View>
            <View style={styles.storyStatItem}>
              <Ionicons
                name="eye-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.storyStatText}>{story.viewsCount || 0}</Text>
            </View>
            <View style={styles.storyStatItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.storyStatText}>
                {story.readingTime || 0} dk
              </Text>
            </View>
          </View>

          {story.tags && story.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {story.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.unlikeButton}
          onPress={() => handleUnlikeStory(story)}
        >
          <Ionicons name="heart" size={20} color={colors.accent} />
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Favorilerim</Text>
          <View style={styles.backButton} />
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="log-in-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>Giriş Gerekli</Text>
          <Text style={styles.emptyStateMessage}>
            Favori hikayelerinizi görmek için giriş yapmalısınız.
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
        <Text style={styles.headerTitle}>Favorilerim</Text>
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
            <Text style={styles.loadingText}>Favoriler yükleniyor...</Text>
          </View>
        ) : likedStories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Henüz favori yok</Text>
            <Text style={styles.emptyStateMessage}>
              Beğendiğiniz hikayeleri favorilere ekleyerek burada görebilirsiniz.
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.exploreButtonText}>Hikaye Keşfet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.storiesContainer}>
            {likedStories.map(story => renderStoryCard(story))}
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
      marginBottom: 24,
    },
    exploreButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    exploreButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
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
      flexDirection: 'row',
    },
    storyContent: {
      flex: 1,
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
      gap: 8,
    },
    authorAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    authorDetails: {
      flex: 1,
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
      color: colors.textSecondary,
    },
    storyTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    storyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    storyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    storyStats: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
    },
    storyStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    storyStatText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    unlikeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
  });