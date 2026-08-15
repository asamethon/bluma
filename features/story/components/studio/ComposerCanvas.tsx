import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import type { useComposer } from '../../hooks/useComposer';
import { renderWithRanges } from '../../utils/richText';

export function ComposerCanvas({ c }: { c: ReturnType<typeof useComposer> }) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.paper, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TextInput
        value={c.cur?.title ?? ''}
        onChangeText={c.setChapterTitle}
        placeholder={t('studio.chapterTitlePlaceholder')}
        placeholderTextColor={colors.textLight}
        maxLength={80}
        style={[styles.title, { color: colors.text }]}
      />
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <TextInput
        onChangeText={c.onChangeBody}
        onSelectionChange={e => c.onBodySelectionChange(e.nativeEvent.selection)}
        selection={c.forcedSel ?? undefined}
        placeholder={t('studio.bodyPlaceholder')}
        placeholderTextColor={colors.textLight}
        multiline
        textAlignVertical="top"
        style={[styles.body, { color: colors.text }]}
      >
        {renderWithRanges(c.bodyDisplay, c.bodyRanges, { fontFamily: Fonts.serifItalic })}
      </TextInput>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.xl + 2,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 25,
    lineHeight: 34,
    padding: 0,
  },
  divider: { height: 1, marginVertical: Spacing.md + 2 },
  body: {
    flex: 1,
    fontFamily: Fonts.serifRegular,
    fontSize: 17,
    lineHeight: 30,
    padding: 0,
    paddingBottom: Spacing.xxl,
  },
});
