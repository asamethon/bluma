import { StoryRow } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { Story } from '@/types';
import { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useOpenFeedStory } from '../hooks/useOpenFeedStory';
import { createHomeStyles } from '../styles/homeStyles';

type Props = { story: Story; position: number; grid: boolean };

/** Tür seçiliyken listelenen hikâye satırı. */
function HomeStoryGridItemView({ story, position, grid }: Props) {
  const { colors } = useTheme();
  const open = useOpenFeedStory();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const onPress = useCallback(() => open(story, 'category', position), [open, position, story]);

  return (
    <View style={grid ? styles.gridStory : styles.listStory}>
      <StoryRow story={story} status={story.isCompleted ? 'completed' : 'ongoing'} onPress={onPress} />
    </View>
  );
}

export const HomeStoryGridItem = memo(HomeStoryGridItemView);
