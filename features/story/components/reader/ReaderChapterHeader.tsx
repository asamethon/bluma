import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import type { ReaderColors } from './types';

type Props = {
  colors: ReaderColors;
  index: number;
  total: number;
  /** Yazarın verdiği bölüm başlığı; yoksa künye tek başına yeter. */
  title: string | null;
  minutes: number;
  onOpenChapters: () => void;
};

/** Her bölümün açılış künyesi: sıra numarası, başlık ve okuma süresi. */
export function ReaderChapterHeader(props: Props) {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const multi = props.total > 1;
  const meta = t('time.minutesShort', { count: props.minutes });

  return (
    <Pressable
      style={styles.chapterHead}
      accessibilityRole="button"
      accessibilityLabel={t('reader.chapters')}
      disabled={!multi}
      onPress={props.onOpenChapters}
    >
      {multi && (
        <View style={styles.chapterKicker}>
          <Text variant="overline" color={colors.primary}>
            {t('story.chapterN', { number: props.index + 1 })}
          </Text>
          <Text variant="overline" color={props.colors.textSecondary}>
            {`/ ${props.total}`}
          </Text>
          <Ionicons name="list" size={13} color={props.colors.textSecondary} />
        </View>
      )}
      {props.title && (
        <Text style={[styles.chapterHeadTitle, { color: props.colors.text, fontFamily: fonts.serif }]}>
          {props.title}
        </Text>
      )}
      <Text variant="caption" color={props.colors.textSecondary} style={styles.chapterHeadMeta}>
        {meta}
      </Text>
    </Pressable>
  );
}
