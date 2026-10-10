import { Motion, Radius, Spacing } from '@/constants/theme';
import type { Story } from '@/types';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../Avatar';
import { GenreTag } from '../Chip';
import { Text } from '../Text';
import { storyCardStyles as styles } from './styles';
import { StoryCover } from './StoryCover';
import { StoryMetrics } from './StoryMeta';

type Props = { story: Story; onPress?: () => void };

/** Öne çıkan hikâye: ortak kitap kapağının geniş vitrin varyantı. */
function StoryCardFeatureView({ story, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.featureWrap, { opacity: pressed ? Motion.pressOpacity : 1 }]}
    >
      <StoryCover story={story} radius={Radius.lg} style={styles.featureMedia} />

      <View style={styles.featureBody}>
        <GenreTag category={story.category ?? 'other'} />
        <Text variant="title" numberOfLines={2}>
          {story.title}
        </Text>
        {!!story.description && (
          <Text variant="body" tone="textSecondary" numberOfLines={2} style={{ marginTop: Spacing.xxs }}>
            {story.description}
          </Text>
        )}

        <View style={styles.featureMeta}>
          <Avatar uri={story.author?.profileImage} name={story.author?.displayName} size={24} />
          <Text variant="label" tone="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
            {story.author?.displayName || t('common.anonymous')}
          </Text>
          <View style={styles.featureStats}><StoryMetrics story={story} /></View>
        </View>
      </View>
    </Pressable>
  );
}

export const StoryCardFeature = memo(StoryCardFeatureView);
