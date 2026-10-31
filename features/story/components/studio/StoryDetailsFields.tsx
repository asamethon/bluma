import { Chip, IconButton, Switch, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { storyInfoFormStyles as styles } from '@/features/story/styles/storyInfoFormStyles';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View, type LayoutChangeEvent } from 'react-native';
import type { useStoryInfoForm } from '../../hooks/useStoryInfoForm';
import { CONTENT_WARNINGS, MAX_TAG_LENGTH, MAX_TAGS, STORY_LANGUAGES } from '../../utils/storyDetails';

type Form = ReturnType<typeof useStoryInfoForm>;
type Props = {
  form: Form;
  /** Klavye açılınca etiket kutusunu görünür alana kaydırmak için. */
  onTagsLayout: (event: LayoutChangeEvent) => void;
  onTagsFocus: () => void;
};

/**
 * Hikâye künyesinin yazar kontrolleri: kitle (+18), dil, etiketler ve içerik
 * uyarıları. Stüdyo yenilenirken (ec14bbf) bu alanlar formdan düşmüştü:
 * yeni hikâyeler +18 işaretlenemiyor, dil arayüz dilinden yazılıyor,
 * etiketsiz ve uyarısız kalıyordu.
 */
export function StoryDetailsFields({ form, onTagsLayout, onTagsFocus }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <View style={local.field}>
        <Text variant="label" tone="textSecondary">{t('studio.audienceLabel')}</Text>
        <View style={local.switchRow}>
          <View style={local.copy}>
            <Text variant="bodyStrong">{t('studio.adultTitle')}</Text>
            <Text variant="caption" tone="textLight">{t('studio.adultHint')}</Text>
          </View>
          <Switch checked={form.isAdult} onChange={form.setAdult} />
        </View>
      </View>

      <View style={local.field}>
        <Text variant="label" tone="textSecondary">{t('studio.languageLabel')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.row}>
          {STORY_LANGUAGES.map(language => (
            <Chip
              key={language.code}
              label={language.name}
              active={form.language === language.code}
              onPress={() => form.setLanguage(language.code)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={local.field} onLayout={onTagsLayout}>
        <Text variant="label" tone="textSecondary">{t('studio.tagsLabel')}</Text>
        <View style={local.tagInputRow}>
          <TextInput
            value={form.tagInput}
            onChangeText={form.setTagInput}
            onSubmitEditing={form.commitTag}
            onFocus={onTagsFocus}
            editable={form.tags.length < MAX_TAGS}
            placeholder={t('studio.tagsPlaceholder')}
            placeholderTextColor={colors.textLight}
            maxLength={MAX_TAG_LENGTH + 1}
            autoCapitalize="none"
            returnKeyType="done"
            blurOnSubmit={false}
            style={[styles.input, local.tagInput,
              { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
          />
          <IconButton
            icon="add"
            variant="sunk"
            onPress={form.commitTag}
            disabled={!form.tagInput.trim() || form.tags.length >= MAX_TAGS}
            accessibilityLabel={t('studio.tagAdd')}
          />
        </View>
        {form.tags.length > 0 && (
          <View style={styles.chips}>
            {form.tags.map(tag => (
              <Chip key={tag} label={`#${tag}`} icon="close" active onPress={() => form.removeTag(tag)} />
            ))}
          </View>
        )}
        <Text variant="caption" tone="textLight">{t('studio.tagsHint', { count: MAX_TAGS })}</Text>
      </View>

      <View style={local.field}>
        <Text variant="label" tone="textSecondary">{t('studio.warningsLabel')}</Text>
        <View style={styles.chips}>
          {CONTENT_WARNINGS.map(warning => (
            <Chip
              key={warning}
              label={t(`contentWarnings.${warning}`)}
              active={form.contentWarnings.includes(warning)}
              color={colors.error}
              onPress={() => form.toggleWarning(warning)}
            />
          ))}
        </View>
        <Text variant="caption" tone="textLight">{t('studio.warningsHint')}</Text>
      </View>
    </>
  );
}

const local = StyleSheet.create({
  field: { gap: Spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  copy: { flex: 1, gap: 2 },
  row: { gap: Spacing.sm },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tagInput: { flex: 1 },
});
