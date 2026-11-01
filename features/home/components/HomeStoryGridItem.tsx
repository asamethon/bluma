import { StoryRow } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { FeedSource } from '@/features/discovery/constants';
import type { Story } from '@/types';
import { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useOpenFeedStory } from '../hooks/useOpenFeedStory';
import { createHomeStyles } from '../styles/homeStyles';

type Props = { story: Story; position: number; grid: boolean; source: FeedSource };

/** Tür sayfasında ve ana sayfanın sonsuz kuyruğunda listelenen hikâye satırı. */
function HomeStoryGridItemView({ story, position, grid, source }: Props) {
  const { colors } = useTheme();
  const open = useOpenFeedStory();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const onPress = useCallback(() => open(story, source, position), [open, position, source, story]);

  return (
    <View style={grid ? styles.gridStory : styles.listStory}>
      <StoryRow story={story} status={story.isCompleted ? 'completed' : 'ongoing'} onPress={onPress} />
    </View>
  );
}

export const HomeStoryGridItem = memo(HomeStoryGridItemView);
