import { ContentMaxWidth, categoryColor, useTheme } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { useAppSelector } from '@/store/hooks';
import { READING_LINE_HEIGHT_MULTIPLIER } from '@/store/preferencesStore';
import type { Story } from '@/types';
import { Pressable, ScrollView, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import { ReaderBody } from './ReaderBody';
import { ReaderChapterHeader } from './ReaderChapterHeader';
import { ReaderChapterTail } from './ReaderChapterTail';
import { ReaderStoryHeader } from './ReaderStoryHeader';
import type { ReaderChaptersState, ReaderColors, ReaderStoryState, ReaderUiState } from './types';

type Props = {
  story: Story;
  colors: ReaderColors;
  isGuest: boolean;
  reader: ReaderStoryState;
  chapters: ReaderChaptersState;
  ui: ReaderUiState;
};

/**
 * Kitabın sayfası. Metin akışı çubuklardan bağımsızdır: üst boşluk sabittir,
 * çubuklar gizlenince satırlar YERİNDEN OYNAMAZ — okuma yeri kaybolmaz.
 */
export function ReaderCanvas({ story, colors: reading, isGuest, reader, chapters, ui }: Props) {
  const { colors, fonts } = useTheme();
  const { width } = useResponsive();
  const readingFont = useAppSelector(state => state.preferences.readingFont);
  const lineSpacing = useAppSelector(state => state.preferences.readingLineSpacing);
  const fontSize = useAppSelector(state => state.preferences.readingFontSize);
  const index = reader.chapterIndex;

  return (
    <ScrollView
      ref={ui.scrollRef}
      style={styles.page}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.body,
        width > ContentMaxWidth.content && styles.wideBody,
        { paddingTop: ui.chromeHeight + 20 },
      ]}
      onScroll={event => {
        ui.handleScroll(event);
        reader.saveScroll(event);
      }}
      scrollEventThrottle={32}
      onContentSizeChange={(_contentWidth, height) => {
        const ratio = reader.pendingScrollRatio.current;
        if (ratio == null) return;
        reader.pendingScrollRatio.current = null;
        requestAnimationFrame(() => ui.scrollRef.current?.scrollTo({ y: height * ratio, animated: false }));
      }}
    >
      <Pressable onPress={ui.toggleChrome} accessibilityLabel={story.title}>
        {index === 0 && <ReaderStoryHeader story={story} colors={reading} />}
        <ReaderChapterHeader
          colors={reading}
          index={index}
          total={chapters.total}
          title={chapters.chapters[index]?.title ?? null}
          minutes={reader.readerContent.readingMinutes}
          onOpenChapters={() => ui.openOverlay('chapters')}
        />
        <ReaderBody
          paragraphs={reader.readerContent.paragraphs}
          firstTextIndex={reader.readerContent.firstTextIndex}
          fontSize={fontSize}
          lineHeightMultiplier={READING_LINE_HEIGHT_MULTIPLIER[lineSpacing]}
          readingFontFamily={readingFont === 'sans' ? fonts.sansRegular : fonts.serifRegular}
          accentColor={categoryColor(story.category, colors.primary)}
          colors={reading}
          loading={reader.isChapterLoading}
        />
        <ReaderChapterTail
          story={story}
          colors={reading}
          guest={isGuest}
          totalChapters={chapters.total}
          isLast={!chapters.hasNext}
          previousTitle={chapters.hasPrevious ? chapters.titleOf(index - 1) : null}
          nextTitle={chapters.hasNext ? chapters.titleOf(index + 1) : null}
          chapterLike={reader.chapterLike}
          onToggleLike={reader.toggleChapterLike}
          onPrevious={() => chapters.goTo(index - 1)}
          onNext={() => chapters.goTo(index + 1)}
        />
      </Pressable>
      <View style={styles.canvasFooter} />
    </ScrollView>
  );
}
