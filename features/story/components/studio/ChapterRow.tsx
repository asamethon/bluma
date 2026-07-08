import { Badge, Text } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StudioChapter } from '../../utils/chapterContent';
import { wordCount } from '../../utils/textStats';

// Bölüm satırı — numara rozeti, başlık, kelime sayısı. Hub kartında ve
// composer bölüm seçici sayfasında ortak kullanılır.
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
  // İçeriği indirmeden (bölüm-bazlı depolamada) kelime sayısını göstermek için —
  // bkz. YAPILACAKLAR 2.2, story.chapterWordCounts.
  wordCountOverride?: number;
}) {
  const { colors } = useTheme();
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
          {chapter.title || `Bölüm ${num}`}
        </Text>
        <Text variant="caption" tone="textLight">
          {words.toLocaleString('tr-TR')} kelime
        </Text>
      </View>
      {showStatusBadge ? (
        <Badge label={words > 0 ? 'Yazıldı' : 'Boş'} tone={words > 0 ? 'success' : 'neutral'} />
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
