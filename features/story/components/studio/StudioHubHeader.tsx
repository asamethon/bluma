import { Text } from '@/components/ui';
import { Motion, alpha, useTheme } from '@/constants/theme';
import { studioHubStyles as styles } from '@/features/story/styles/studioHubStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Props = { topInset: number; hasStories: boolean; onNewStory: () => void };

export function StudioHubHeader({ topInset, hasStories, onNewStory }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ paddingTop: topInset }}>
      <View style={styles.intro}>
        <Text variant="display" numberOfLines={2}>{t('studio.hubTitle')}</Text>
        <Text variant="body" tone="textSecondary">{t('studio.hubSubtitle')}</Text>
      </View>

      <Pressable
        onPress={onNewStory}
        style={({ pressed }) => [styles.cta, { opacity: pressed ? Motion.pressOpacity : 1 }]}
      >
        <View style={[styles.ctaIcon, { backgroundColor: alpha(colors.bloom, 0.14) }]}>
          <Ionicons name="add" size={21} color={colors.bloom} />
        </View>
        <View style={styles.ctaCopy}>
          <Text variant="bodyStrong">{t('studio.newStoryCta')}</Text>
          <Text variant="caption" tone="textLight">{t('studio.newStoryCtaSub')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color={colors.textLight} />
      </Pressable>

      {hasStories && (
        <View style={styles.storiesHead}>
          <Text variant="heading">{t('studio.yourStories')}</Text>
        </View>
      )}
    </View>
  );
}
