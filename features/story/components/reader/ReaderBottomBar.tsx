import { Button, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import { formatCompactCount } from '@/features/story/utils/readerContent';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Animated as AnimatedType } from 'react-native';
import { Animated, Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import type { ReaderColors } from './types';

type Props = {
  story: Story;
  colors: ReaderColors;
  animation: AnimatedType.Value;
  visible: boolean;
  safeBottom: number;
  guest: boolean;
  chapterIndex: number;
  hasNext: boolean;
  onNext: () => void;
  onShare: () => void;
};

/** Alt çubuk: hikâye aksiyonları solda, okumayı sürdüren birincil aksiyon sağda. */
export function ReaderBottomBar(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { requireAuth } = useGuestGate();
  const liked = useAppSelector(state => state.story.likedStories.some(item => item.id === props.story.id));
  const saved = useAppSelector(state => state.story.savedStories.some(item => item.id === props.story.id));

  const openComments = () => {
    if (requireAuth('comment')) {
      router.push(`/story/${props.story.id}/comments?chapter=${props.chapterIndex}` as never);
    }
  };
  const like = () => {
    if (requireAuth('like')) void storyActions.likeStory(props.story.id);
  };
  const save = () => {
    if (requireAuth('save')) void storyActions.saveStory(props.story.id);
  };

  const stat = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string | null,
    active: boolean,
    activeColor: string,
    onPress: () => void,
    accessibilityLabel: string,
  ) => (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.chromeStat}
    >
      <Ionicons name={icon} size={21} color={active ? activeColor : props.colors.textSecondary} />
      {label !== null && (
        <Text variant="label" color={active ? activeColor : props.colors.textSecondary}>{label}</Text>
      )}
    </Pressable>
  );

  return (
    <Animated.View
      style={[
        styles.bottomChrome,
        {
          paddingBottom: props.safeBottom + 12,
          backgroundColor: props.colors.background,
          borderTopColor: props.colors.border,
          opacity: props.animation,
          transform: [{
            translateY: props.animation.interpolate({
              inputRange: [0, 1], outputRange: [76 + props.safeBottom, 0],
            }),
          }],
        },
      ]}
      pointerEvents={props.visible ? 'auto' : 'none'}
    >
      {stat(liked ? 'heart' : 'heart-outline', formatCompactCount(props.story.likesCount), liked, colors.bloom, like, t('reader.likeStory'))}
      {stat('chatbubble-outline', formatCompactCount(props.story.commentsCount), false, colors.bloom, openComments, t('notifSettings.comments'))}
      {stat(
        saved ? 'bookmark' : 'bookmark-outline', null, saved, colors.secondary, save,
        t(saved ? 'storyScreen.inLibrary' : 'storyScreen.addToLibrary'),
      )}
      {stat('share-social-outline', null, false, colors.primary, props.onShare, t('reader.shareStory'))}
      <View style={styles.flexSpacer} />
      {props.guest ? (
        <Button label={t('reader.readMore')} variant="primary" size="sm" icon="lock-closed-outline" onPress={() => requireAuth('read')} />
      ) : props.hasNext ? (
        <Button label={t('reader.nextChapter')} variant="primary" size="sm" iconRight="arrow-forward" onPress={props.onNext} />
      ) : null}
    </Animated.View>
  );
}
