import { SectionHeader, StoryRow } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { ContinueEntry } from '../services/homeSections';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useOpenFeedStory } from '../hooks/useOpenFeedStory';
import { createHomeStyles } from '../styles/homeStyles';

/** Okumaya Devam Et: okuyucu doğrudan kalınan bölümde açılır. */
function HomeContinueSectionView({ entries }: { entries: ContinueEntry[] }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const open = useOpenFeedStory();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <SectionHeader title={t('home.continueReading')} />
      <View style={styles.continueList}>
        {entries.map(({ story, chapterIndex }, index) => (
          <StoryRow
            key={story.id}
            story={story}
            status={t('home.leftAtChapter', { chapter: chapterIndex + 1 })}
            style={styles.listRow}
            onPress={() => open(story, 'continue_reading', index, chapterIndex)}
          />
        ))}
      </View>
    </View>
  );
}

export const HomeContinueSection = memo(HomeContinueSectionView);
