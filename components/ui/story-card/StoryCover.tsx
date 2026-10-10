import { alpha, categoryColor, Radius, useTheme } from '@/constants/theme';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../Text';

type Props = {
  story: Story;
  radius?: number;
  showChapterBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Tüm hikâye kartlarının ortak, kitap hissi veren kapak yüzeyi. */
export function StoryCover({ story, radius = Radius.md, showChapterBadge = true, style }: Props) {
  const { colors, borders } = useTheme();
  const accent = categoryColor(story.category, colors.primary);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.surfaceVariant, borderColor: colors.border, borderWidth: borders.hair, borderRadius: radius },
        style,
      ]}
    >
      {story.coverImage ? (
        <Image
          source={{ uri: story.coverImage }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={story.id}
          transition={160}
        />
      ) : (
        <View style={styles.fallback}>
          <View style={[styles.fallbackMark, { backgroundColor: alpha(accent, 0.12) }]}>
            <Ionicons name="book-outline" size={28} color={accent} />
          </View>
        </View>
      )}

      <View style={[styles.spine, { backgroundColor: alpha(colors.black, 0.14) }]} pointerEvents="none" />
      <View style={[styles.spineLight, { backgroundColor: alpha(colors.white, 0.16) }]} pointerEvents="none" />

      {story.isCompleted ? (
        <View style={[styles.stateSeal, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={11} color="#fff" />
        </View>
      ) : null}

      {story.isPremium ? (
        <View style={[styles.premiumSeal, { backgroundColor: colors.secondary }]}>
          <Ionicons name="star" size={11} color="#3A2A06" />
        </View>
      ) : null}

      {showChapterBadge ? (
        <View style={[styles.chapterBadge, { backgroundColor: colors.overlayStrong }]}>
          <Ionicons name="book-outline" size={11} color="#fff" />
          <Text variant="labelSm" color="#fff">{story.chaptersCount || 1}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fallbackMark: {
    width: 54, height: 54, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  spine: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5 },
  spineLight: { position: 'absolute', top: 0, bottom: 0, left: 5, width: 1 },
  stateSeal: {
    position: 'absolute', top: 8, left: 9,
    width: 22, height: 22, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  premiumSeal: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  chapterBadge: {
    position: 'absolute', left: 9, bottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 22, paddingHorizontal: 7, borderRadius: Radius.xs,
  },
});
