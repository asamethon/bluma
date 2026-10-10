import type { ThemeColors } from '@/constants/Colors';
import type { useReaderChapters } from '../../hooks/useReaderChapters';
import type { useReaderStory } from '../../hooks/useReaderStory';
import type { useReaderUi } from '../../hooks/useReaderUi';

export type ReaderColors = Pick<
  ThemeColors,
  'background' | 'surface' | 'text' | 'textSecondary' | 'border'
>;

/** Okuyucunun görünüm modelleri — ekran ile kanvas arasında tek parça geçer. */
export type ReaderStoryState = ReturnType<typeof useReaderStory>;
export type ReaderChaptersState = ReturnType<typeof useReaderChapters>;
export type ReaderUiState = ReturnType<typeof useReaderUi>;
