import { Text } from '@/components/ui';
import { Fonts, Motion, Spacing, useTheme } from '@/constants/theme';
import { RANKS, getRankIndex } from '@/features/challenges/definitions';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

const fmt = (xp: number) => (xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : `${xp}`);

/**
 * Bahçenin ilerleme künyesi: kart değil, ayraç değil — tek satır. İlerleme
 * çizgisi satırın İÇİNDE, seviye ile XP'nin arasında akar; böylece blokta
 * yatay kural görünümü veren hiçbir çizgi kalmaz. Rütbenin adı kimlik
 * rozetinde, ayrıntı görevler ekranında durur.
 */
export function ProfileProgressStrip({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const xp = useAppSelector(state => state.challenge.xp);
  const rankIndex = getRankIndex(xp);
  const rank = RANKS[rankIndex];
  const nextRank = RANKS[rankIndex + 1];
  const progress = nextRank ? Math.min((xp - rank.min) / (nextRank.min - rank.min), 1) : 1;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={{ top: Spacing.sm, bottom: Spacing.sm }}
      style={({ pressed }) => [styles.root, { opacity: pressed ? Motion.pressOpacity : 1 }]}
    >
      <Ionicons
        name={rank.icon as React.ComponentProps<typeof Ionicons>['name']}
        size={14}
        color={colors.primary}
      />
      <Text variant="label" numberOfLines={1}>
        {t('challengesScreen.level', { level: rankIndex + 1 })}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceVariant }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.xp, { color: colors.textLight }]}>
        {nextRank ? `${fmt(xp)}/${fmt(nextRank.min)}` : fmt(xp)} XP
      </Text>
      <Ionicons name="chevron-forward" size={13} color={colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    minHeight: 28,
  },
  track: { flex: 1, minWidth: 32, height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  xp: { fontFamily: Fonts.mono, fontSize: 11, lineHeight: 15 },
});
