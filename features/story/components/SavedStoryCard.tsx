import { StoryRow } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { Story } from '@/types';
import React from 'react';
import { StyleSheet } from 'react-native';

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

  return (
    <StoryRow
      story={story}
      status={story.isCompleted ? 'completed' : 'ongoing'}
      onPress={() => onPress(story)}
      onAuthorPress={() => onAuthorPress(story)}
      action={{ icon: 'bookmark', color: colors.primary, onPress: () => onUnsave(story) }}
      style={styles.row}
    />
  );
});

const styles = StyleSheet.create({ row: { paddingHorizontal: Spacing.screenX, paddingVertical: Spacing.sm } });
