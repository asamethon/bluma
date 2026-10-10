import { Text } from '@/components/ui';
import { Motion, alpha, useTheme } from '@/constants/theme';
import { NextReadsSection } from '@/features/story/components/NextReadsSection';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import { ReaderChapterNav } from './ReaderChapterNav';
import { ReaderGuestGate } from './ReaderGuestGate';
import type { ReaderColors } from './types';

type Props = {
  story: Story;
  colors: ReaderColors;
  guest: boolean;
  totalChapters: number;
  isLast: boolean;
  previousTitle: string | null;
  nextTitle: string | null;
  chapterLike: { liked: boolean; count: number } | null;
  onToggleLike: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

/** Bölüm sonu: kapanış işareti, bölüm beğenisi, gezinme ve bitişte öneriler. */
export function ReaderChapterTail(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (props.guest) return <ReaderGuestGate totalChapters={props.totalChapters} readingColors={props.colors} />;

  const like = props.chapterLike;

  return (
    <>
      <View style={styles.endRule}>
        <View style={[styles.endRuleLine, { backgroundColor: props.colors.border }]} />
        <View style={[styles.endRuleDot, { backgroundColor: colors.bloom }]} />
        <View style={[styles.endRuleLine, { backgroundColor: props.colors.border }]} />
      </View>

      {like && (
        <Pressable
          onPress={props.onToggleLike}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.chapterLikeRow,
            {
              borderColor: like.liked ? colors.bloom : props.colors.border,
              backgroundColor: like.liked ? alpha(colors.bloom, 0.1) : 'transparent',
              opacity: pressed ? Motion.pressOpacity : 1,
            },
          ]}
        >
          <Ionicons
            name={like.liked ? 'heart' : 'heart-outline'}
            size={19}
            color={like.liked ? colors.bloom : props.colors.textSecondary}
          />
          <Text variant="label" color={like.liked ? colors.bloom : props.colors.textSecondary}>
            {t('reader.likeChapter')}{like.count > 0 ? ` · ${like.count}` : ''}
          </Text>
        </Pressable>
      )}

      <ReaderChapterNav
        colors={props.colors}
        previousTitle={props.previousTitle}
        nextTitle={props.nextTitle}
        onPrevious={props.onPrevious}
        onNext={props.onNext}
      />

      {props.isLast && (
        <>
          <View style={styles.chapterNavEnd}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text variant="label" color={props.colors.textSecondary}>{t('reader.storyFinished')}</Text>
          </View>
          <NextReadsSection finished={props.story} />
        </>
      )}
    </>
  );
}
