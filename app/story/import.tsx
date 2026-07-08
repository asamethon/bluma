import { Button, CategoryChip, IconButton, Screen, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { useImportStory } from '@/features/story/hooks/useImportStory';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const GENRE_KEYS = [
  'romance', 'fantasy', 'sci_fi', 'mystery',
  'adventure', 'horror', 'comedy', 'drama', 'poetry',
] as const;

// "Hikâyeni Taşı" — Wattpad'den (ya da başka bir kaynaktan) çok bölümlü bir
// metni tek seferde yapıştır → otomatik bölümlere ayrılır → önizle → yayınla.
// Ekran yalnızca kompozisyon yapar; iş mantığı useImportStory'de.
export default function ImportStoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const s = useImportStory();

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <IconButton icon="close" size={40} onPress={() => router.back()} />
        <Text variant="subheading" style={{ fontWeight: '700' }}>Hikâyeni Taşı</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text variant="caption" tone="textSecondary" style={{ marginBottom: 16 }}>
          Wattpad'deki (ya da başka bir yerdeki) hikâyeni tek seferde buraya yapıştır —
          "Bölüm 1", "1. Bölüm" gibi başlıkları otomatik tanıyıp bölümlere ayırırız.
        </Text>

        <TextInput
          value={s.title}
          onChangeText={s.setTitle}
          placeholder="Hikâye başlığı"
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
          placeholder="Hikâyenin tamamını buraya yapıştır…"
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          style={[styles.pasteArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />

        {s.pastedText.trim().length > 0 && (
          <View style={[styles.previewCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text variant="label" style={{ fontWeight: '700', marginBottom: 8 }}>
              {s.chapters.length} bölüm algılandı · {s.totalWords.toLocaleString('tr-TR')} kelime
            </Text>
            {s.chapters.slice(0, 5).map((c, i) => (
              <Text key={c.id} variant="caption" tone="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
                {i + 1}. {c.title}
              </Text>
            ))}
            {s.chapters.length > 5 && (
              <Text variant="caption" tone="textLight" style={{ marginTop: 2 }}>
                ve {s.chapters.length - 5} bölüm daha…
              </Text>
            )}
          </View>
        )}

        <Button
          label={s.publishing ? 'Yayınlanıyor…' : 'Yayınla'}
          variant="primary"
          onPress={s.publish}
          disabled={s.publishing || s.chapters.length === 0}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 8,
  },
  body: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 60,
  },
  titleInput: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16, lineHeight: 21,
    fontWeight: '600',
    marginBottom: 12,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pasteArea: {
    minHeight: 220,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    lineHeight: 20,
  },
  previewCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
