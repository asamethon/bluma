import { PageHeader } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { createCommentsStyles } from '../../styles/commentsStyles';

type Props = {
  count: number;
  safeTop: number;
  chapterIndex?: number;
  filterChapter: boolean;
  styles: ReturnType<typeof createCommentsStyles>;
  onBack: () => void;
  onFilter: (chapterOnly: boolean) => void;
};

export function CommentsHeader(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t('commentsScreen.title', { count: props.count })}
        topInset={props.safeTop}
        onBack={props.onBack}
      />
      {props.chapterIndex !== undefined && (
        <View style={props.styles.chapterFilterRow}>
          <TouchableOpacity
            style={[props.styles.chapterFilterChip, !props.filterChapter && { backgroundColor: colors.primary }]}
            onPress={() => props.onFilter(false)}
          >
            <Text style={[props.styles.chapterFilterText, !props.filterChapter && props.styles.activeFilterText]}>
              {t('challengesScreen.filterAll')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[props.styles.chapterFilterChip, props.filterChapter && { backgroundColor: colors.primary }]}
            onPress={() => props.onFilter(true)}
          >
            <Text style={[props.styles.chapterFilterText, props.filterChapter && props.styles.activeFilterText]}>
              {t('commentsScreen.thisChapter', { chapter: props.chapterIndex + 1 })}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
