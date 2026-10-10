import { Motion, useTheme } from '@/constants/theme';
import type { Story } from '@/types';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { GenreTag } from '../Chip';
import { Text } from '../Text';
import { storyCardStyles as styles } from './styles';
import { StoryCover } from './StoryCover';
import { StoryByline } from './StoryMeta';

type Props = { story: Story; width?: number; onPress?: () => void };

/** Yatay raflarda kullanılan, kapak ve kitap kimliği odaklı portre kart. */
function StoryCardSpineView({ story, width = 142, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ width, opacity: pressed ? Motion.pressOpacity : 1 }]}
    >
      <View style={[styles.bookFrame, { height: width * 1.5 }]}>
        <View style={[styles.bookDepth, { backgroundColor: colors.borderStrong }]} />
        <StoryCover story={story} style={styles.portraitCover} />
      </View>

      <View style={styles.caption}>
        <GenreTag category={story.category ?? 'other'} />
        <Text variant="storyTitle" numberOfLines={2} style={styles.captionTitle}>
          {story.title}
        </Text>
        <StoryByline story={story} />
      </View>
    </Pressable>
  );
}

export const StoryCardSpine = memo(StoryCardSpineView);
