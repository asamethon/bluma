import { SectionHeader, StoryRow } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { FeedSource } from '@/features/discovery/constants';
import { useResponsiveGrid } from '@/hooks/useResponsive';
import type { Story } from '@/types';
import { memo, useMemo } from 'react';
import { View } from 'react-native';
import { useOpenFeedStory } from '../hooks/useOpenFeedStory';
import { createHomeStyles } from '../styles/homeStyles';

type Props = { section: FeedSource; title: string; stories: Story[] };

/** Kısa, sabit sayılı dikey liste (en fazla 6 satır), bu yüzden FlatList değil. */
function HomeStoryListSectionView({ section, title, stories }: Props) {
  const { colors } = useTheme();
  const open = useOpenFeedStory();
  const { numColumns, columnWidth } = useResponsiveGrid();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  if (!stories.length) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <View style={[
        styles.storyList,
        { flexDirection: numColumns > 1 ? 'row' : 'column', flexWrap: numColumns > 1 ? 'wrap' : 'nowrap' },
      ]}>
        {stories.map((story, index) => (
          <View key={story.id} style={numColumns > 1 ? { width: columnWidth } : undefined}>
            <StoryRow
              story={story}
              status={story.isCompleted ? 'completed' : 'ongoing'}
              style={styles.listRow}
              onPress={() => open(story, section, index)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export const HomeStoryListSection = memo(HomeStoryListSectionView);
