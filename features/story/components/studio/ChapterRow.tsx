import { Badge, Text } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { StudioChapter } from '../../utils/chapterContent';
import { wordCount } from '../../utils/textStats';

export function ChapterRow({
  chapter,
  num,
  active,
  showStatusBadge,
  onPress,
  wordCountOverride,
}: {
  chapter: StudioChapter;
  num: number;
  active?: boolean;
  showStatusBadge?: boolean;
  onPress: () => void;
  wordCountOverride?: number;
}) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const words = wordCountOverride ?? wordCount(chapter.content);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: active ? colors.primarySoft : 'transparent' }]}
    >
      <View
        style={[
          styles.num,
          { backgroundColor: active ? colors.primary : colors.surfaceVariant },
        ]}
      >
        <Text style={[styles.numText, { color: active ? '#fff' : colors.textSecondary }]}>
          {num}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {chapter.title || t('story.chapterN', { number: num })}
        </Text>
        <Text variant="caption" tone="textLight">
          {t('studio.wordCount', { count: words, formatted: words.toLocaleString(i18n.language) })}
        </Text>
      </View>
      {showStatusBadge ? (
        <Badge label={words > 0 ? t('studio.written') : t('studio.empty')} tone={words > 0 ? 'success' : 'neutral'} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontFamily: Fonts.mono, fontSize: 12, lineHeight: 16, fontWeight: '700' },
});
