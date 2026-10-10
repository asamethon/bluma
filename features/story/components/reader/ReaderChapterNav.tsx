import { Text } from '@/components/ui';
import { Motion } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import type { ReaderColors } from './types';

type Props = {
  colors: ReaderColors;
  previousTitle: string | null;
  nextTitle: string | null;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * Bölüm sonundaki gezinme. Okur burada durur; sıradaki bölümün ADINI görmek,
 * "sonraki" yazan bir okla devam etmekten daha güçlü bir davettir.
 */
export function ReaderChapterNav(props: Props) {
  const { t } = useTranslation();
  if (!props.previousTitle && !props.nextTitle) return null;

  const row = (
    direction: 'previous' | 'next',
    title: string,
    onPress: () => void,
  ) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.chapterNavRow,
        { borderColor: props.colors.border, opacity: pressed ? Motion.pressOpacity : 1 },
      ]}
    >
      {direction === 'previous' && <Ionicons name="arrow-back" size={17} color={props.colors.textSecondary} />}
      <View style={[styles.chapterNavText, direction === 'next' && { alignItems: 'flex-end' }]}>
        <Text variant="labelSm" color={props.colors.textSecondary}>
          {t(direction === 'previous' ? 'reader.previousChapter' : 'reader.nextChapter')}
        </Text>
        <Text variant="bodyStrong" color={props.colors.text} numberOfLines={1}>{title}</Text>
      </View>
      {direction === 'next' && <Ionicons name="arrow-forward" size={17} color={props.colors.textSecondary} />}
    </Pressable>
  );

  return (
    <View style={styles.chapterNav}>
      {props.previousTitle && row('previous', props.previousTitle, props.onPrevious)}
      {props.nextTitle && row('next', props.nextTitle, props.onNext)}
    </View>
  );
}
