import { Badge, Divider, MenuButton, Text } from '@/components/ui';
import { categoryLabel, Motion, Radius, Spacing, useTheme } from '@/constants/theme';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { splitChapters } from '../../utils/chapterContent';
import { formatRelativeTime } from '../../utils/time';
import { ChapterRow } from './ChapterRow';
import { CoverThumb } from './CoverThumb';

type Props = {
  story: Story;
  expanded: boolean;
  onToggle: () => void;
  onOpenChapter: (index: number) => void;
  onAddChapter: () => void;
  onEditInfo: () => void;
  onLaunch: () => void;
  onDelete: () => void;
};

/**
 * Stüdyo satırı. Kart kutusu yok: içerik ekran kenar boşluğuyla hizalı akar,
 * hikâyeler hairline ayraçla ayrılır. Bölümler açıldığında kapak sütununun
 * hizasına girintilenir.
 */
function StudioStoryCardBase({
  story, expanded, onToggle, onOpenChapter, onAddChapter, onEditInfo, onLaunch, onDelete,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const chapters = React.useMemo(
    () => splitChapters(story.content, story.chapterTitles),
    [story.content, story.chapterTitles],
  );

  return (
    <View>
      <View style={styles.head}>
        <CoverThumb coverImage={story.coverImage} category={story.category} />
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text variant="subheading" style={styles.title} numberOfLines={2}>
              {story.title || t('studio.untitled')}
            </Text>
            <MenuButton
              size={32}
              iconSize={18}
              color={colors.textLight}
              title={story.title || t('studio.untitled')}
              accessibilityLabel={t('common.more')}
              dismissKeyboardOnOpen
              items={[
                { id: 'info', label: t('studio.editStoryInfo'), symbol: 'square.and.pencil', onPress: onEditInfo },
                ...(story.isPublished
                  ? [{ id: 'launch', label: t('launch.makeLaunch'), symbol: 'megaphone', onPress: onLaunch }]
                  : []),
                { id: 'delete', label: t('studio.deleteStoryTitle'), symbol: 'trash', destructive: true, onPress: onDelete },
              ]}
            />
          </View>
          <Text variant="caption" tone="textLight" numberOfLines={1}>
            {categoryLabel(story.category)} · {formatRelativeTime(story.updatedAt)}
          </Text>
          <View style={styles.metaRow}>
            <Badge
              label={story.isPublished ? t('storyStatus.published') : t('storyStatus.draft')}
              tone={story.isPublished ? 'success' : 'neutral'}
            />
            <Text variant="caption" tone="textLight">
              {t('studio.chapterCount', { count: chapters.length })}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.toggle, { opacity: pressed ? Motion.pressOpacity : 1 }]}
      >
        <Text variant="label" tone="textSecondary">
          {expanded ? t('studio.hideChapters') : t('studio.showChapters')}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
      </Pressable>

      {expanded && (
        <View style={styles.chapters}>
          {chapters.map((c, i) => (
            <ChapterRow
              key={c.id}
              chapter={c}
              num={i + 1}
              onPress={() => onOpenChapter(i)}
              wordCountOverride={story.chaptersInSubcollection ? story.chapterWordCounts?.[i] : undefined}
            />
          ))}
          <Pressable
            onPress={onAddChapter}
            style={({ pressed }) => [
              styles.addChapter,
              { borderColor: colors.border, opacity: pressed ? Motion.pressOpacity : 1 },
            ]}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text variant="label" color={colors.primary}>{t('studio.addChapter')}</Text>
          </Pressable>
        </View>
      )}

      <Divider style={styles.divider} />
    </View>
  );
}

export const StudioStoryCard = React.memo(StudioStoryCardBase);

// Kapak (46) + boşluk (12): bölümler künyenin hizasına girintilenir.
const CHAPTER_INSET = 46 + Spacing.md;

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.lg, alignItems: 'flex-start' },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  title: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2, flexWrap: 'wrap' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginLeft: CHAPTER_INSET,
  },
  chapters: { marginLeft: CHAPTER_INSET, paddingBottom: Spacing.sm },
  addChapter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  divider: { marginTop: Spacing.sm },
});
