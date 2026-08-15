import { Text } from '@/components/ui';
import { Fonts, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { useComposer } from '../../hooks/useComposer';
import { parseImageToken } from '../../utils/imageToken';
import { renderInlineFormatting } from '../../utils/richText';
import { StoryImage } from '../StoryImage';

export function ComposerPreview({ c, topInset }: { c: ReturnType<typeof useComposer>; topInset: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const chapter = c.cur;
  const paras = (chapter?.content || '').split('\n\n').filter(p => p.trim());

  return (
    <Modal visible={c.preview} animationType="slide" statusBarTranslucent onRequestClose={() => c.setPreview(false)}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }]}>
          <Text variant="overline" tone="textLight">{t('studio.readerPreview')}</Text>
          <Pressable onPress={() => c.setPreview(false)} hitSlop={8} style={[styles.close, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="close" size={17} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.screenX, paddingBottom: 48 }}>
          <Text variant="overline" color={colors.primary} style={{ marginBottom: Spacing.sm }}>
            {(c.story?.title || t('studio.untitled'))} · {t('story.chapterN', { number: c.index + 1 })}
          </Text>
          <Text variant="title" style={{ marginBottom: Spacing.lg }}>
            {chapter?.title || t('story.chapterN', { number: c.index + 1 })}
          </Text>
          {paras.length > 0 ? (
            paras.map((p, i) => {
              const img = parseImageToken(p);
              if (img) return <StoryImage key={i} uri={img} />;
              return <Text key={i} style={[styles.body, { color: colors.text }]}>{renderInlineFormatting(p)}</Text>;
            })
          ) : (
            <Text variant="reading" tone="textLight" style={{ fontStyle: 'italic' }}>
              {t('studio.emptyChapterPreview')}
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { fontFamily: Fonts.serifRegular, fontSize: 18, lineHeight: 31, marginBottom: Spacing.md + 2 },
});
