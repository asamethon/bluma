import { SectionHeader, StoryCardFeature } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { Story } from '@/types';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useOpenFeedStory } from '../hooks/useOpenFeedStory';
import { createHomeStyles } from '../styles/homeStyles';

/**
 * Editörün Seçimi: yalnızca elle işaretlenmiş (`isEditorsPick`) hikâyeler.
 * Birden fazla seçim varsa her gün sıradakine geçilir (bkz. homeSections).
 */
function HomeFeatureSectionView({ story }: { story: Story }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const open = useOpenFeedStory();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <SectionHeader title={t('home.editorsPick')} />
      <StoryCardFeature story={story} onPress={() => open(story, 'editors_pick', 0)} />
    </View>
  );
}

export const HomeFeatureSection = memo(HomeFeatureSectionView);
