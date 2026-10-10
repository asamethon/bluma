import { Motion, useTheme } from '@/constants/theme';
import type { Story } from '@/types';
import { formatCount } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { storyCardStyles as styles } from './styles';

export function StoryByline({ story, onPress }: { story: Story; onPress?: () => void }) {
  const fallback = story.author?.displayName;
  const label = story.author?.username ? `@${story.author.username}` : fallback;
  const text = <Text variant="caption" tone="textLight" numberOfLines={1}>{label}</Text>;
  if (!onPress) return text;
  return (
    <Pressable
      onPress={event => { event.stopPropagation(); onPress(); }}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed ? Motion.pressOpacity : 1 })}
    >
      {text}
    </Pressable>
  );
}

export function StoryMetrics({ story, views = false }: { story: Story; views?: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.metrics}>
      <Metric
        icon="time-outline"
        value={t('story.readingMinutesShort', { count: story.readingTime || 5 })}
        color={colors.textLight}
      />
      <Metric
        icon={views ? 'eye-outline' : 'heart-outline'}
        value={formatCount(views ? story.viewsCount : story.likesCount)}
        color={colors.textLight}
      />
    </View>
  );
}

function Metric({ icon, value, color }: { icon: keyof typeof Ionicons.glyphMap; value: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={13} color={color} />
      <Text variant="caption" tone="textLight">{value}</Text>
    </View>
  );
}
