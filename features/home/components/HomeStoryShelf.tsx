import { SectionHeader, StoryCardSpine } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { FeedSource } from '@/features/discovery/constants';
import type { Story } from '@/types';
import { memo, useCallback, useMemo } from 'react';
import { FlatList, type ListRenderItemInfo, View } from 'react-native';
import { useOpenFeedStory } from '../hooks/useOpenFeedStory';
import { createHomeStyles } from '../styles/homeStyles';

type Props = { section: FeedSource; title: string; stories: Story[] };

function HomeStoryShelfView({ section, title, stories }: Props) {
  const { colors } = useTheme();
  const open = useOpenFeedStory();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Story>) => (
    <StoryCardSpine story={item} onPress={() => open(item, section, index)} />
  ), [open, section]);
  if (!stories.length) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <FlatList
        horizontal
        data={stories}
        keyExtractor={story => story.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelf}
        initialNumToRender={4}
        windowSize={5}
        renderItem={renderItem}
      />
    </View>
  );
}

export const HomeStoryShelf = memo(HomeStoryShelfView);
