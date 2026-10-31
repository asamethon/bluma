import { Divider, Text } from '@/components/ui';
import { Motion, alpha, useTheme } from '@/constants/theme';
import { studioHubStyles as styles } from '@/features/story/styles/studioHubStyles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type Props = { topInset: number; hasStories: boolean; onNewStory: () => void };

export function StudioHubHeader({ topInset, hasStories, onNewStory }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={{ paddingTop: topInset }}>
      <View style={styles.intro}>
        <Text variant="display" numberOfLines={2}>{t('studio.hubTitle')}</Text>
        <Text variant="body" tone="textSecondary">{t('studio.hubSubtitle')}</Text>
      </View>

      <View style={styles.ctaGroup}>
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
        <Divider inset={40 + 12} />
        {/* Hazır metni bölümlere ayırıp tek seferde yayınlar; giriş bir
            kurtarma commit'inde (aad7a8b) kaybolmuştu. */}
        <Pressable
          onPress={() => router.push('/story/import')}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? Motion.pressOpacity : 1 }]}
        >
          <View style={[styles.ctaIcon, { backgroundColor: alpha(colors.primary, 0.12) }]}>
            <Ionicons name="document-text-outline" size={19} color={colors.primary} />
          </View>
          <View style={styles.ctaCopy}>
            <Text variant="bodyStrong">{t('import.title')}</Text>
            <Text variant="caption" tone="textLight">{t('studio.importCtaSub')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.textLight} />
        </Pressable>
      </View>

      {hasStories && (
        <View style={styles.storiesHead}>
          <Text variant="heading">{t('studio.yourStories')}</Text>
        </View>
      )}
    </View>
  );
}
