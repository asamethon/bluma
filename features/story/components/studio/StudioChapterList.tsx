import { Text } from '@/components/ui';
import { Motion, Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, type ListRenderItemInfo } from 'react-native';
import type { StudioChapter } from '../../utils/chapterContent';
import { ChapterRow } from './ChapterRow';

type Props = { chapters: StudioChapter[]; counts?: number[]; onOpen: (index: number) => void; onAdd: () => void };
const keyExtractor = (chapter: StudioChapter) => chapter.id;
const Row = memo(function Row({ chapter, index, words, onOpen }: {
  chapter: StudioChapter; index: number; words?: number; onOpen: Props['onOpen'];
}) {
  const open = useCallback(() => onOpen(index), [index, onOpen]);
  return <ChapterRow chapter={chapter} num={index + 1} wordCountOverride={words} onPress={open} />;
});

export const StudioChapterList = memo(function StudioChapterList({ chapters, counts, onOpen, onAdd }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<StudioChapter>) => (
    <Row chapter={item} index={index} words={counts?.[index]} onOpen={onOpen} />
  ), [counts, onOpen]);
  return <FlatList data={chapters} keyExtractor={keyExtractor} renderItem={renderItem} scrollEnabled={false}
    ListFooterComponent={<Pressable onPress={onAdd}
      style={({ pressed }) => [styles.add, { borderColor: colors.border, opacity: pressed ? Motion.pressOpacity : 1 }]}>
      <Ionicons name="add" size={16} color={colors.primary} />
      <Text variant="label" color={colors.primary}>{t('studio.addChapter')}</Text>
    </Pressable>} />;
});

const styles = StyleSheet.create({
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: Spacing.md, marginTop: Spacing.xs, borderWidth: 1, borderRadius: Radius.sm },
});
