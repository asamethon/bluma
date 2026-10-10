import { Sheet, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import type { ComposerModel } from '../../hooks/useComposer';
import { ChapterRow } from './ChapterRow';

export function ChapterSwitcherSheet({ c }: { c: ComposerModel }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isTablet } = useResponsive();

  return (
    <Sheet
      visible={c.sheet}
      onClose={() => c.setSheet(false)}
      title={t('studio.chapters')}
      contentStyle={styles.body}
    >
      <FlatList
        style={{ maxHeight: isTablet ? 520 : 380 }}
        contentContainerStyle={styles.list}
        data={c.chapters}
        keyExtractor={chapter => chapter.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ChapterRow
            chapter={item}
            num={index + 1}
            active={index === c.index}
            onPress={() => c.switchTo(index)}
          />
        )}
        ListFooterComponent={
          <Pressable onPress={c.addChapter} style={[styles.add, { borderColor: colors.borderStrong }]}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text variant="label" color={colors.primary}>{t('studio.addChapter')}</Text>
          </Pressable>
        }
        />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 2 },
  body: { paddingHorizontal: Spacing.lg },
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
