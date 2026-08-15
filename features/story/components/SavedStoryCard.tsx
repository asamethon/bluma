import { useTheme } from '@/constants/theme';
import { formatRelativeTime } from '@/features/story/utils/time';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const SavedStoryCard = React.memo(function SavedStoryCard({
  story,
  onPress,
  onAuthorPress,
  onUnsave,
}: {
  story: Story;
  onPress: (story: Story) => void;
  onAuthorPress: (story: Story) => void;
  onUnsave: (story: Story) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.storyCard} onPress={() => onPress(story)}>
      <View style={styles.storyHeader}>
        <TouchableOpacity style={styles.authorInfo} onPress={() => onAuthorPress(story)}>
          <View style={styles.authorAvatar}>
            {story.author?.profileImage ? (
              <Image source={{ uri: story.author.profileImage }} style={styles.authorAvatarImage} />
            ) : (
              <Ionicons name="person" size={16} color={colors.primary} />
            )}
          </View>
          <View>
            <Text style={styles.authorName}>
              {story.author?.displayName || t('common.anonymous')}
            </Text>
            <Text style={styles.authorUsername}>@{story.author?.username || 'user'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={(e) => {
            e.stopPropagation();
            onUnsave(story);
          }}
        >
          <Ionicons name="bookmark" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.storyContent}>
        <Text style={styles.storyTitle}>{story.title}</Text>
        <Text style={styles.storyDescription} numberOfLines={3}>
          {story.description || story.content?.substring(0, 150) + '...'}
        </Text>
      </View>

      <View style={styles.storyFooter}>
        <View style={styles.storyStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>
              {t('time.minutesShort', { count: story.readingTime || 5 })}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{story.likesCount || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{story.commentsCount || 0}</Text>
          </View>
        </View>

        <Text style={styles.storyTime}>{formatRelativeTime(story.createdAt)}</Text>
      </View>
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
    },
    storyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    authorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    authorAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    authorAvatarImage: { width: 32, height: 32, borderRadius: 16 },
    authorName: { fontSize: 14, lineHeight: 18, fontWeight: '600', color: colors.text },
    authorUsername: { fontSize: 12, lineHeight: 16, color: colors.primary },
    unsaveButton: { padding: 4 },
    storyContent: { marginBottom: 16 },
    storyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 24,
    },
    storyDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    storyFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    storyStats: { flexDirection: 'row', gap: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
    storyTime: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  });
