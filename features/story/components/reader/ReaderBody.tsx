import { Skeleton, Text } from '@/components/ui';
import { alpha, useTheme } from '@/constants/theme';
import { StoryImage } from '@/features/story/components/StoryImage';
import { parseImageToken } from '@/features/story/utils/imageToken';
import { renderInlineFormatting } from '@/features/story/utils/richText';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import type { ReaderColors } from './types';

const SKELETON_WIDTHS = ['96%', '99%', '92%', '97%', '88%', '99%', '94%', '61%'] as const;

type Props = {
  paragraphs: string[];
  firstTextIndex: number;
  fontSize: number;
  lineHeightMultiplier: number;
  readingFontFamily: string;
  accentColor: string;
  colors: ReaderColors;
  loading: boolean;
};

export function ReaderBody(props: Props) {
  const { fonts } = useTheme();
  const { t } = useTranslation();
  const textStyle = {
    fontSize: props.fontSize,
    lineHeight: props.fontSize * props.lineHeightMultiplier,
    color: props.colors.text,
    fontFamily: props.readingFontFamily,
  };

  // Yüklenirken boş sayfa değil, metnin ritmini taşıyan yer tutucu satırlar:
  // bölüm değiştirince "içerik yok" yanılsaması oluşmaz.
  if (props.loading) {
    return (
      <View style={styles.bodySkeleton}>
        {SKELETON_WIDTHS.map((width, index) => (
          <Skeleton
            key={`${width}-${index}`}
            width={width}
            height={props.fontSize * 0.72}
            color={alpha(props.colors.textSecondary, 0.22)}
          />
        ))}
      </View>
    );
  }

  if (!props.paragraphs.length) {
    return (
      <Text style={[styles.bodyText, textStyle, { color: props.colors.textSecondary, fontStyle: 'italic' }]}>
        {t('reader.emptyChapter')}
      </Text>
    );
  }

  return (
    <View style={styles.storyBody}>
      {props.paragraphs.map((paragraph, index) => {
        const imageUrl = parseImageToken(paragraph);
        if (imageUrl) return <StoryImage key={`${index}-${imageUrl}`} uri={imageUrl} />;
        if (index === props.firstTextIndex) {
          return (
            <View key={index} style={styles.dropCapRow}>
              <Text style={[styles.dropCap, { color: props.accentColor, fontFamily: fonts.serif }]}>
                {paragraph.charAt(0)}
              </Text>
              <Text style={[styles.bodyText, textStyle, styles.flexText]}>
                {renderInlineFormatting(paragraph.slice(1), { fontFamily: fonts.serifBoldItalic })}
              </Text>
            </View>
          );
        }
        return (
          <Text key={index} style={[styles.bodyText, textStyle, { marginTop: props.fontSize }]}>
            {renderInlineFormatting(paragraph, { fontFamily: fonts.serifBoldItalic })}
          </Text>
        );
      })}
    </View>
  );
}
