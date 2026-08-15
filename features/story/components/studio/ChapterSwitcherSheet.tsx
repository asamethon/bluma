import { Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { useComposer } from '../../hooks/useComposer';
import { ChapterRow } from './ChapterRow';

export function ChapterSwitcherSheet({ c, safeBottom }: { c: ReturnType<typeof useComposer>; safeBottom: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isTablet } = useResponsive();

  return (
    <Modal visible={c.sheet} transparent animationType="slide" statusBarTranslucent onRequestClose={() => c.setSheet(false)}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={() => c.setSheet(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: safeBottom + Spacing.xl }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.head}>
            <Text variant="heading" style={{ fontSize: 18 }}>{t('studio.chapters')}</Text>
            <Pressable onPress={() => c.setSheet(false)} hitSlop={8} style={[styles.close, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: isTablet ? 520 : 380 }} contentContainerStyle={{ gap: 2 }} showsVerticalScrollIndicator={false}>
            {c.chapters.map((ch, i) => (
              <ChapterRow key={ch.id} chapter={ch} num={i + 1} active={i === c.index} onPress={() => c.switchTo(i)} />
            ))}
            <Pressable onPress={c.addChapter} style={[styles.add, { borderColor: colors.borderStrong }]}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text variant="label" color={colors.primary}>{t('studio.addChapter')}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 2,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: Spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm, paddingHorizontal: 4 },
  close: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },
});
