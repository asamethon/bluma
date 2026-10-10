import { GenreTag, Text } from '@/components/ui';
import { Motion } from '@/constants/theme';
import type { StoryInfoStyles } from '@/features/story/styles/storyInfoStyles';
import type { Story } from '@/types';
import { Image } from 'expo-image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Props = {
  story: Story;
  styles: StoryInfoStyles;
  onAuthorPress: () => void;
};

export const StoryInfoHero = memo(function StoryInfoHero({ story, styles, onAuthorPress }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.hero}>
      {story.coverImage ? (
        <Image source={{ uri: story.coverImage }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]} />
      )}
      <View style={styles.heroMeta}>
        <GenreTag category={story.category ?? 'other'} />
        <Text variant="title" numberOfLines={3}>{story.title}</Text>
        <Pressable
          onPress={onAuthorPress}
          disabled={!story.authorId}
          style={({ pressed }) => ({ opacity: pressed ? Motion.pressOpacity : 1 })}
        >
          <Text variant="label" tone="primary">
            @{story.author?.username || t('common.anonymous')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});
