import { StoryRow } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { Story } from '@/types';
import React from 'react';
import { StyleSheet } from 'react-native';

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

  return (
    <StoryRow
      story={story}
      status={story.isCompleted ? 'completed' : 'ongoing'}
      onPress={() => onPress(story)}
      action={{ icon: 'heart', color: colors.bloom, onPress: () => onUnlike(story) }}
      style={styles.row}
    />
  );
});

const styles = StyleSheet.create({ row: { paddingHorizontal: Spacing.screenX, paddingVertical: Spacing.sm } });
