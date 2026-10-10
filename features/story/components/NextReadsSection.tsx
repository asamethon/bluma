import { SectionHeader, StoryCardSpine, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { useNextReads } from '@/features/story/hooks/useNextReads';
import { Story } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

const CARD_WIDTH = 132;

/**
 * Hikâyenin sonundaki "sırada ne var" bölümü.
 *
 * Buraya kadar gelen okur, uygulamadaki en değerli anda: az önce bir şeyi
 * bitirdi ve boşta. Öneri yoksa ekran çıkmaz sokak oluyordu.
 */
export function NextReadsSection({ finished }: { finished: Story | null }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const stories = useNextReads(finished);

  const open = useCallback(
    (storyId: string) => router.push(`/story/${storyId}` as any),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Story }) => (
      <StoryCardSpine story={item} width={CARD_WIDTH} onPress={() => open(item.id)} />
    ),
    [open]
  );

  // Önerecek bir şey yoksa bölüm hiç çizilmez — boş başlık göstermek,
  // kataloğun ince olduğunu ilan etmekten başka işe yaramaz.
  if (stories.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      <SectionHeader title={t('reader.nextReadsTitle')} />
      <Text variant="caption" tone="textLight" style={styles.subtitle}>
        {t('reader.nextReadsSubtitle')}
      </Text>
      <FlatList
        data={stories}
        horizontal
        keyExtractor={s => s.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.xxxl, paddingTop: Spacing.xl, borderTopWidth: StyleSheet.hairlineWidth },
  subtitle: { paddingHorizontal: Spacing.screenX, marginTop: -Spacing.xs, marginBottom: Spacing.md },
  list: { paddingHorizontal: Spacing.screenX, gap: Spacing.md },
});
