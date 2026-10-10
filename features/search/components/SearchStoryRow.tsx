import { StoryRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { Story } from '@/types';
import { memo, useCallback } from 'react';
import { View } from 'react-native';

type Props = {
  story: Story;
  position: number;
  columns: number;
  onOpen: (story: Story, position: number) => void;
};

function SearchStoryRowView({ story, position, columns, onOpen }: Props) {
  const open = useCallback(() => onOpen(story, position), [onOpen, position, story]);
  const style = columns > 1
    ? { paddingHorizontal: Spacing.gutter / 2, marginBottom: Spacing.md }
    : { paddingHorizontal: Spacing.screenX, marginBottom: Spacing.md };

  return (
    <View style={style}>
      <StoryRow
        story={story}
        status={story.isCompleted ? 'completed' : null}
        onPress={open}
      />
    </View>
  );
}

export const SearchStoryRow = memo(SearchStoryRowView);
