import { useTheme } from '@/constants/theme';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const FavoriteStoryCard = React.memo(function FavoriteStoryCard({
  story,
  onPress,
  onUnlike,
}: {
  story: Story;
  onPress: (story: Story) => void;
  onUnlike: (story: Story) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.storyCard} onPress={() => onPress(story)}>
      <View style={styles.storyContent}>
        <View style={styles.storyHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.authorAvatar}>
              {story.author?.profileImage ? (
                <Image source={{ uri: story.author.profileImage }} style={styles.authorAvatarImage} />
              ) : (
                <Ionicons name="person" size={16} color={colors.primary} />
              )}
            </View>
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>
                {story.author?.displayName || t('common.anonymous')}
              </Text>
              <Text style={styles.authorUsername}>@{story.author?.username || 'user'}</Text>
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
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.storyStatText}>{story.commentsCount || 0}</Text>
          </View>
          <View style={styles.storyStatItem}>
            <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.storyStatText}>{story.viewsCount || 0}</Text>
          </View>
          <View style={styles.storyStatItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.storyStatText}>
              {t('time.minutesShort', { count: story.readingTime || 0 })}
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

      <TouchableOpacity style={styles.unlikeButton} onPress={() => onUnlike(story)}>
        <Ionicons name="heart" size={20} color={colors.accent} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const createStyles = (colors: any) =>
  StyleSheet.create({
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
    storyContent: { flex: 1 },
    storyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    authorAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorAvatarImage: { width: 32, height: 32, borderRadius: 16 },
    authorDetails: { flex: 1 },
    authorName: { fontSize: 14, lineHeight: 18, fontWeight: '600', color: colors.text },
    authorUsername: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
    storyTitle: {
      fontSize: 18, lineHeight: 23,
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
    storyStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    storyStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    storyStatText: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: { fontSize: 12, lineHeight: 16, color: colors.primary, fontWeight: '500' },
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
