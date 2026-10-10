import { storyInfoFormStyles as styles } from '@/features/story/styles/storyInfoFormStyles';
import { Button, CategoryChip, IconButton, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { StoryCategory } from '@/types';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, TextInput, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import type { useStoryInfoForm } from '../../hooks/useStoryInfoForm';
import { StoryCoverPicker } from './StoryCoverPicker';
import { CoverPickerSheet } from '../CoverPickerSheet';

const WRITE_GENRES: StoryCategory[] = [
  'fantasy', 'romance', 'mystery', 'sci_fi', 'drama', 'adventure', 'horror', 'poetry', 'comedy',
];

type Form = ReturnType<typeof useStoryInfoForm>;

export function StoryInfoForm({ form, safeBottom }: { form: Form; safeBottom: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef({ title: 0, description: 0 });

  const keyboard = useAnimatedKeyboard();
  const containerAnimStyle = useAnimatedStyle(() => ({ paddingBottom: keyboard.height.value }));
  const fillerAnimStyle = useAnimatedStyle(() => ({ height: keyboard.height.value }));
  const footerAnimStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value > 0 ? 12 : safeBottom + 12,
  }));

  const scrollToField = (field: keyof typeof fieldOffsets.current) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(fieldOffsets.current[field] - Spacing.xl, 0), animated: true });
    }, Platform.OS === 'ios' ? 120 : 250);
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        pointerEvents="none"
        style={[styles.keyboardFiller, fillerAnimStyle, { backgroundColor: colors.surface }]}
      />
      <Animated.View style={[{ flex: 1 }, containerAnimStyle]}>
        <View style={styles.header}>
          <IconButton icon="arrow-back" onPress={form.cancel} />
          <Text variant="heading" style={{ fontSize: 18 }}>
            {form.isNew ? t('studio.newStory') : t('studio.editStoryInfo')}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.screenX, gap: Spacing.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StoryCoverPicker
            coverImage={form.coverImage}
            category={form.category}
            onPick={() => form.setCoverSheet(true)}
          />

          <View
            style={{ gap: Spacing.sm }}
            onLayout={e => { fieldOffsets.current.title = e.nativeEvent.layout.y; }}
          >
            <Text variant="label" tone="textSecondary">{t('studio.storyTitleLabel')}</Text>
            <TextInput
              value={form.title}
              onChangeText={form.setTitle}
              onFocus={() => scrollToField('title')}
              placeholder={t('studio.storyTitlePlaceholder')}
              placeholderTextColor={colors.textLight}
              maxLength={100}
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: form.titleError ? colors.error : colors.border },
              ]}
            />
            {form.titleError && <Text variant="caption" tone="error">{t('studio.titleTooShort')}</Text>}
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text variant="label" tone="textSecondary">{t('studio.genreLabel')}</Text>
            <View style={styles.chips}>
              {WRITE_GENRES.map(g => (
                <CategoryChip
                  key={g}
                  category={g}
                  shape="pill"
                  active={form.category === g}
                  onPress={() => form.setCategory(g)}
                />
              ))}
            </View>
          </View>

          <View
            style={{ gap: Spacing.sm }}
            onLayout={e => { fieldOffsets.current.description = e.nativeEvent.layout.y; }}
          >
            <Text variant="label" tone="textSecondary">{t('studio.descriptionLabel')}</Text>
            <TextInput
              value={form.description}
              onChangeText={form.setDescription}
              onFocus={() => scrollToField('description')}
              placeholder={t('studio.descriptionPlaceholder')}
              placeholderTextColor={colors.textLight}
              maxLength={160}
              multiline
              style={[
                styles.input,
                styles.multiline,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
            />
          </View>

          {!form.isNew && (
            <Button label={t('studio.deleteStoryTitle')} variant="ghost" icon="trash-outline" onPress={form.remove} />
          )}
        </ScrollView>

        <Animated.View style={[styles.footer, footerAnimStyle, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button label={t('common.cancel')} variant="secondary" onPress={form.cancel} style={{ flex: 1 }} />
          <Button
            label={t('common.save')}
            variant="primary"
            icon="checkmark"
            loading={form.saving}
            onPress={form.save}
            style={{ flex: 1.4 }}
          />
        </Animated.View>

        <CoverPickerSheet
          visible={form.coverSheet}
          onClose={() => form.setCoverSheet(false)}
          onPickGallery={form.pickCover}
          onTakePhoto={form.takePhoto}
        />
      </Animated.View>
    </View>
  );
}
