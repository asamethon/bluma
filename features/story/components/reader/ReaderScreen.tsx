import { ProgressBar } from '@/components/ui';
import { alpha, useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { getReadingPalette } from '@/store/preferencesStore';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Animated, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReaderChapters } from '../../hooks/useReaderChapters';
import { useReaderStory } from '../../hooks/useReaderStory';
import { useReaderUi } from '../../hooks/useReaderUi';
import { readerStyles as styles } from '../../styles/readerStyles';
import { ReaderBottomBar } from './ReaderBottomBar';
import { ReaderCanvas } from './ReaderCanvas';
import { useReaderGuard } from './ReaderGuard';
import { ReaderSheets } from './ReaderSheets';
import { ReaderTopBar } from './ReaderTopBar';

type Props = { storyId: string; requestedChapter?: string };

export function ReaderScreen({ storyId, requestedChapter }: Props) {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const isGuest = useAppSelector(state => state.auth.isGuest);
  const readingTheme = useAppSelector(state => state.preferences.readingTheme);
  const reader = useReaderStory({ storyId, requestedChapter, isGuest });
  const ui = useReaderUi(insets.top);
  const chapters = useReaderChapters({
    story: reader.story,
    legacyCount: reader.legacyChapters.length,
    chapterIndex: reader.chapterIndex,
    isGuest,
    selectChapter: reader.selectChapter,
    onNavigated: ui.scrollToTop,
  });

  const guard = useReaderGuard(reader.story, reader.isLoading, insets.top);
  if (guard.blocked) return guard.blocked;
  const story = guard.story;

  const reading = getReadingPalette(readingTheme) || colors;
  const darkReading = readingTheme === 'dark' || readingTheme === 'black'
    || (readingTheme === 'light' && scheme === 'dark');
  // Konum üst çubukta, süre bölüm künyesinde durur — ikisi birden tekrar olurdu.
  const chapterLabel = isGuest
    ? t('reader.previewChapter1')
    : chapters.total > 1
      ? `${t('story.chapterN', { number: reader.chapterIndex + 1 })} / ${chapters.total}`
      : t('time.minutesShort', { count: reader.readerContent.readingMinutes });

  return (
    <View style={[styles.page, { backgroundColor: reading.background }]}>
      <StatusBar barStyle={darkReading ? 'light-content' : 'dark-content'} />
      <ReaderCanvas
        story={story}
        colors={reading}
        isGuest={isGuest}
        reader={reader}
        chapters={chapters}
        ui={ui}
      />
      <ReaderTopBar
        story={story}
        colors={reading}
        safeTop={insets.top}
        height={ui.chromeHeight}
        animation={ui.chromeAnimation}
        visible={ui.chromeVisible}
        chapterLabel={chapterLabel}
        glassScheme={darkReading ? 'dark' : 'light'}
        currentUserId={currentUserId}
        onBack={router.back}
        onOpenChapters={() => ui.openOverlay('chapters')}
        onOpenSettings={() => ui.openOverlay('settings')}
        onOpenList={() => ui.openOverlay('list')}
        onReport={() => ui.openOverlay('report')}
      />
      <ReaderBottomBar
        story={story}
        colors={reading}
        animation={ui.chromeAnimation}
        visible={ui.chromeVisible}
        safeBottom={insets.bottom}
        guest={isGuest}
        chapterIndex={reader.chapterIndex}
        hasNext={chapters.hasNext}
        onNext={() => chapters.goTo(reader.chapterIndex + 1)}
        onShare={() => ui.openOverlay('share')}
      />
      {/* Okuma rayı çubuklardan bağımsız: metne dalmışken de ilerleme görünür. */}
      <ProgressBar
        value={ui.progress.interpolate({
          inputRange: [0, 1], outputRange: ['0%', '100%'],
        }) as Animated.AnimatedInterpolation<string>}
        color={alpha(reading.text, 0.45)}
        track="transparent"
        height={2}
        style={styles.progressRail}
      />
      <ReaderSheets
        story={story}
        colors={reading}
        chapters={chapters.chapters}
        chapterIndex={reader.chapterIndex}
        overlay={ui.overlay}
        onClose={ui.closeOverlay}
        onSelectChapter={chapters.goTo}
      />
    </View>
  );
}
