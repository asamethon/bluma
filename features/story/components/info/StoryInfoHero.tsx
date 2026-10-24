import { GenreTag, Text } from '@/components/ui';
import { Motion, Spacing, useTheme } from '@/constants/theme';
import type { StoryInfoStyles } from '@/features/story/styles/storyInfoStyles';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
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
  const { colors } = useTheme();

  return (
    <View style={styles.hero}>
      {story.coverImage ? (
        <Image source={{ uri: story.coverImage }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]} />
      )}
      <View style={styles.heroMeta}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <GenreTag category={story.category ?? 'other'} />
          {story.targetAudience === 'adult' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: `${colors.error}1A` }}>
              <Ionicons name="warning" size={11} color={colors.error} />
              <Text variant="labelSm" color={colors.error}>18+</Text>
            </View>
          )}
        </View>
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
        {Array.isArray(story.tags) && story.tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs }}>
            {story.tags.slice(0, 5).map(tag => (
              <View key={tag} style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: `${colors.primary}14` }}>
                <Text variant="labelSm" color={colors.primary}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});
