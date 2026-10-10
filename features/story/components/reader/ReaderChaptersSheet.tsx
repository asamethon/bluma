import { Sheet, Text } from '@/components/ui';
import { Motion, alpha, useTheme } from '@/constants/theme';
import type { ReaderChapter } from '@/features/story/utils/readerContent';
import { memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import type { ReaderColors } from './types';

const ROW_HEIGHT = 58;

type RowProps = {
  chapter: ReaderChapter;
  current: boolean;
  colors: ReaderColors;
  accent: string;
  fallback: string;
  onPress: (index: number) => void;
};

const ChapterRow = memo(function ChapterRow({ chapter, current, colors, accent, fallback, onPress }: RowProps) {
  return (
    <Pressable
      onPress={() => onPress(chapter.index)}
      accessibilityRole="button"
      accessibilityState={{ selected: current }}
      style={({ pressed }) => [
        styles.chapterListRow,
        {
          backgroundColor: current ? alpha(accent, 0.1) : 'transparent',
          opacity: pressed ? Motion.pressOpacity : 1,
        },
      ]}
    >
      <Text variant="labelSm" color={current ? accent : colors.textSecondary} style={styles.chapterListIndex}>
        {String(chapter.index + 1).padStart(2, '0')}
      </Text>
      <Text
        variant={current ? 'bodyStrong' : 'body'}
        color={current ? accent : colors.text}
        numberOfLines={1}
        style={styles.chapterListTitle}
      >
        {chapter.title || fallback}
      </Text>
      {current && <View style={[styles.chapterListMark, { backgroundColor: accent }]} />}
    </Pressable>
  );
});

type Props = {
  visible: boolean;
  chapters: ReaderChapter[];
  currentIndex: number;
  colors: ReaderColors;
  onClose: () => void;
  onSelect: (index: number) => void;
};

/** İçindekiler: okunan bölüm işaretli, tek dokunuşla herhangi bir bölüme atlama. */
export function ReaderChaptersSheet({ visible, chapters, currentIndex, colors: reading, onClose, onSelect }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const listRef = useRef<FlatList<ReaderChapter>>(null);

  const select = useCallback((index: number) => {
    onClose();
    onSelect(index);
  }, [onClose, onSelect]);

  const renderItem = useCallback(({ item }: { item: ReaderChapter }) => (
    <ChapterRow
      chapter={item}
      current={item.index === currentIndex}
      colors={reading}
      accent={colors.primary}
      fallback={t('story.chapterN', { number: item.index + 1 })}
      onPress={select}
    />
  ), [colors.primary, currentIndex, reading, select, t]);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('reader.chapters')}
      subtitle={t('reader.chapterCount', { count: chapters.length })}
      palette={reading}
    >
      <FlatList
        ref={listRef}
        style={styles.chapterList}
        data={chapters}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chapterListContent}
        getItemLayout={(_data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        initialScrollIndex={Math.max(0, currentIndex - 2)}
        onScrollToIndexFailed={() => listRef.current?.scrollToOffset({ offset: 0, animated: false })}
      />
    </Sheet>
  );
}
