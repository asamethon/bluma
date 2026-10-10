import { Text } from '@/components/ui';
import { alpha, useTheme } from '@/constants/theme';
import { CHALLENGE_DEFS, RANKS, getRankIndex } from '@/features/challenges/definitions';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { challengeStyles as styles } from '../../styles/challengeStyles';
import { formatXp } from './challengeFormat';

type Props = { xp: number; streak: number; completed: number };

/** Rütbe künyesi: renkli kahraman blok yerine tipografik bir açılış. */
export function RankHero({ xp, streak, completed }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const rankIndex = getRankIndex(xp);
  const rank = RANKS[rankIndex];
  const next = RANKS[rankIndex + 1];
  const progress = next ? Math.min((xp - rank.min) / (next.min - rank.min), 1) : 1;

  return (
    <View style={styles.rankHero}>
      <View style={styles.rankRow}>
        <View style={[styles.rankIconWrap, { backgroundColor: alpha(colors.primary, 0.12) }]}>
          <Ionicons name={rank.icon as never} size={23} color={colors.primary} />
        </View>
        <View style={styles.flexCopy}>
          <Text variant="overline" tone="textLight">
            {t('challengesScreen.level', { level: rankIndex + 1 })}
          </Text>
          <Text variant="title" numberOfLines={1}>{t(rank.name)}</Text>
        </View>
      </View>

      <View style={styles.rankProgress}>
        <View style={styles.xpRowLabels}>
          <Text style={[styles.xpSmall, { color: colors.text }]}>{formatXp(xp)} XP</Text>
          <Text variant="caption" tone="textLight" numberOfLines={1} style={styles.flexCopy}>
            {next
              ? t('challengesScreen.nextRank', { rank: t(next.name), xp: formatXp(next.min - xp) })
              : t('challengesScreen.maxLevel')}
          </Text>
        </View>
        <View style={[styles.xpBarBg, { backgroundColor: colors.surfaceVariant }]}>
          <View style={[styles.xpBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>

      <View style={styles.heroPills}>
        <View style={styles.heroPill}>
          <Text variant="titleSm">{t('challengesScreen.dayCount', { count: streak })}</Text>
          <Text variant="overline" tone="textLight">{t('challengesScreen.streakLabel')}</Text>
        </View>
        <View style={styles.heroPill}>
          <Text variant="titleSm">{completed}/{CHALLENGE_DEFS.length}</Text>
          <Text variant="overline" tone="textLight">{t('challengesScreen.challengeLabel')}</Text>
        </View>
      </View>
    </View>
  );
}
