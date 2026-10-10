import { importStoryStyles as styles } from '@/features/story/styles/importStoryStyles';
import { Button, CategoryChip, IconButton, Screen, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useImportStory } from '@/features/story/hooks/useImportStory';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  TextInput,
  View,
} from 'react-native';

const GENRE_KEYS = [
  'romance', 'fantasy', 'sci_fi', 'mystery',
  'adventure', 'horror', 'comedy', 'drama', 'poetry',
] as const;

export default function ImportStoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const s = useImportStory();

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <IconButton icon="close" size={40} onPress={() => router.back()} />
        <Text variant="subheading" style={{ fontWeight: '700' }}>{t('import.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text variant="caption" tone="textSecondary" style={{ marginBottom: 16 }}>
          {t('import.description')}
        </Text>

        <TextInput
          value={s.title}
          onChangeText={s.setTitle}
          placeholder={t('import.titlePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.titleInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />

        <View style={styles.genreGrid}>
          {GENRE_KEYS.map((g) => (
            <CategoryChip
              key={g}
              category={g}
              active={s.category === g}
              onPress={() => s.setCategory(g)}
            />
          ))}
        </View>

        <TextInput
          value={s.pastedText}
          onChangeText={s.setPastedText}
          placeholder={t('import.pastePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          style={[styles.pasteArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />

        {s.pastedText.trim().length > 0 && (
          <View style={[styles.previewCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text variant="label" style={{ fontWeight: '700', marginBottom: 8 }}>
              {t('import.detected', { chapters: s.chapters.length, words: s.totalWords.toLocaleString(i18n.language) })}
            </Text>
            {s.chapters.slice(0, 5).map((c, i) => (
              <Text key={c.id} variant="caption" tone="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
                {i + 1}. {c.title}
              </Text>
            ))}
            {s.chapters.length > 5 && (
              <Text variant="caption" tone="textLight" style={{ marginTop: 2 }}>
                {t('import.andMore', { count: s.chapters.length - 5 })}
              </Text>
            )}
          </View>
        )}

        <Button
          label={s.publishing ? t('import.publishing') : t('studio.publishAction')}
          variant="primary"
          onPress={s.publish}
          disabled={s.publishing || s.chapters.length === 0}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </Screen>
  );
}
