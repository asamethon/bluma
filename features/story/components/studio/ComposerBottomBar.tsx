import { Button, IconButton, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { useComposer } from '../../hooks/useComposer';

export function ComposerBottomBar({ c, bottomInset }: { c: ReturnType<typeof useComposer>; bottomInset: number }) {
  const { colors, shadows } = useTheme();
  const { t, i18n } = useTranslation();
  const nf = (n: number) => n.toLocaleString(i18n.language);

  return (
    <View
      style={[
        styles.bar,
        shadows.md,
        { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: bottomInset + 12 },
      ]}
    >
      <View style={styles.stats}>
        <Text variant="heading" style={{ fontSize: 20 }}>{nf(c.words)}</Text>
        <Text variant="caption" tone="textSecondary">{t('studio.wordsLabel')}</Text>
        <View style={{ flex: 1 }} />
        <Text variant="caption" tone="textLight">
          {t('studio.charsAndReadTime', { chars: nf(c.chars), minutes: c.readMin })}
        </Text>
      </View>

      {!c.focus && (
        <View style={styles.tools}>
          <IconButton
            icon="list-outline"
            variant={c.bulletMode ? 'soft' : 'sunk'}
            size={38}
            onPress={c.toggleBullet}
          />
          <Pressable
            onPress={c.toggleItalic}
            style={[styles.italicBtn, { backgroundColor: c.italicMode ? colors.primarySoft : colors.surfaceVariant }]}
          >
            <Text style={{ fontStyle: 'italic', fontWeight: '700', fontSize: 16, lineHeight: 21, color: c.italicMode ? colors.primary : colors.text }}>i</Text>
          </Pressable>
          <IconButton icon="ellipsis-horizontal" variant="sunk" size={38} onPress={() => c.insertAtCursor('\n\n* * *\n\n')} />
          <IconButton icon="return-down-back-outline" variant="sunk" size={38} onPress={() => c.insertAtCursor('\n\n')} />
          <IconButton
            icon="image-outline"
            variant="sunk"
            size={38}
            onPress={c.insertImage}
            color={c.imageUploading ? colors.textLight : undefined}
          />
        </View>
      )}

      <View style={styles.actions}>
        <Button label={t('studio.preview')} variant="secondary" icon="eye-outline" onPress={() => c.setPreview(true)} style={{ flex: 1 }} />
        {c.isPublished ? (
          <Button label={t('storyStatus.published')} variant="secondary" icon="checkmark-circle" disabled style={{ flex: 1.4 }} />
        ) : (
          <Button label={t('studio.publishAction')} variant="primary" iconRight="arrow-forward" loading={c.publishing} onPress={c.publish} style={{ flex: 1.4 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.md,
  },
  stats: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.md },
  tools: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm + 2 },
  italicBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
