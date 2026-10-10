import { IconButton, MenuButton, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ComposerModel } from '../../hooks/useComposer';

export function ComposerHeader({ c }: { c: ComposerModel }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View>
      <View style={styles.row}>
        <IconButton icon="arrow-back" onPress={c.back} />
        <Pressable
          onPress={() => c.setSheet(true)}
          style={[styles.pill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
        >
          <Text variant="label" numberOfLines={1}>{t('story.chapterN', { number: c.index + 1 })}</Text>
          <Ionicons name="chevron-down" size={13} color={colors.textLight} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {!c.focus && c.saveState && (
          <View style={styles.save}>
            <Ionicons
              name={c.saveState === 'saving' ? 'ellipsis-horizontal' : 'cloud-done-outline'}
              size={15}
              color={c.saveState === 'saving' ? colors.textLight : colors.success}
            />
            <Text variant="caption" tone="textSecondary">
              {c.saveState === 'saving' ? t('studio.saving') : t('studio.saved')}
            </Text>
          </View>
        )}
        <IconButton
          icon={c.focus ? 'contract-outline' : 'scan-outline'}
          variant="sunk"
          onPress={c.toggleFocus}
        />
        <MenuButton
          accessibilityLabel={t('common.more')}
          items={[
            { id: 'info', label: t('studio.editStoryInfo'), symbol: 'square.and.pencil', onPress: c.editInfo },
            { id: 'delete', label: t('studio.deleteChapterTitle'), symbol: 'trash', destructive: true, onPress: c.deleteChapter },
          ]}
        />
      </View>

      {!c.focus && (
        <Text variant="overline" tone="textLight" numberOfLines={1} style={styles.overline}>
          {c.story?.title || t('studio.untitled')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    maxWidth: 150,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  save: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 2 },
  overline: { paddingHorizontal: Spacing.screenX, paddingTop: 2 },
});
