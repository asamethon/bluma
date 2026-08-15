import { Badge, Text } from '@/components/ui';
import { categoryLabel, Radius, Spacing, useTheme } from '@/constants/theme';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { splitChapters } from '../../utils/chapterContent';
import { formatRelativeTime } from '../../utils/time';
import { ChapterRow } from './ChapterRow';
import { CoverThumb } from './CoverThumb';
import { OverflowMenu } from './OverflowMenu';

type Props = {
  story: Story;
  expanded: boolean;
  onToggle: () => void;
  onOpenChapter: (index: number) => void;
  onAddChapter: () => void;
  onEditInfo: () => void;
  onDelete: () => void;
};

function StudioStoryCardBase({
  story, expanded, onToggle, onOpenChapter, onAddChapter, onEditInfo, onDelete,
}: Props) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const [menu, setMenu] = React.useState(false);
  const chapters = React.useMemo(
    () => splitChapters(story.content, story.chapterTitles),
    [story.content, story.chapterTitles],
  );

  return (
    <View style={[styles.card, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.head}>
        <CoverThumb coverImage={story.coverImage} category={story.category} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={styles.titleRow}>
            <Text variant="heading" style={{ flex: 1, fontSize: 17, lineHeight: 23 }} numberOfLines={2}>
              {story.title || t('studio.untitled')}
            </Text>
            <Pressable onPress={() => setMenu(true)} hitSlop={8}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textLight} />
            </Pressable>
          </View>
          <Text variant="caption" tone="textLight" numberOfLines={1}>
            {categoryLabel(story.category)} · {formatRelativeTime(story.updatedAt)}
          </Text>
          <View style={styles.metaRow}>
            <Badge
              label={story.isPublished ? t('storyStatus.published') : t('storyStatus.draft')}
              tone={story.isPublished ? 'success' : 'neutral'}
            />
            <Text variant="caption" tone="textLight">{t('studio.chapterCount', { count: chapters.length })}</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onToggle}
        style={[styles.toggle, { borderTopColor: colors.divider }]}
      >
        <Text variant="label" tone="textSecondary">
          {expanded ? t('studio.hideChapters') : t('studio.showChapters')}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
      </Pressable>

      {expanded && (
        <View style={[styles.chapters, { backgroundColor: colors.surfaceVariant }]}>
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
            style={[styles.addChapter, { borderColor: colors.borderStrong }]}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text variant="label" color={colors.primary}>{t('studio.addChapter')}</Text>
          </Pressable>
        </View>
      )}

      <OverflowMenu
        visible={menu}
        onClose={() => setMenu(false)}
        top={140}
        items={[
          { icon: 'create-outline', label: t('studio.editStoryInfo'), onPress: onEditInfo },
          { icon: 'trash-outline', label: t('studio.deleteStoryTitle'), danger: true, onPress: onDelete },
        ]}
      />
    </View>
  );
}

export const StudioStoryCard = React.memo(StudioStoryCardBase);

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  head: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md + 2, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 1,
    borderTopWidth: 1,
  },
  chapters: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm + 2, paddingTop: 4, gap: 2 },
  addChapter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md - 2,
    marginTop: 4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },
});
