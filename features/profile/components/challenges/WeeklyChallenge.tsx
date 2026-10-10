import { Text } from '@/components/ui';
import { alpha, useTheme } from '@/constants/theme';
import { WEEKLY_FEATURED } from '@/features/challenges/definitions';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { challengeStyles as styles } from '../../styles/challengeStyles';

/** Haftanın görevi — solda tek renkli kural, kalan her şey tipografi. */
export function WeeklyChallenge({ progress }: { progress: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const fraction = Math.min(progress / WEEKLY_FEATURED.goal, 1);

  return (
    <View style={[styles.weeklyCard, { backgroundColor: alpha(colors.bloom, 0.07), borderLeftColor: colors.bloom }]}>
      <View style={[styles.weeklyIcon, { backgroundColor: alpha(colors.bloom, 0.15) }]}>
        <Ionicons name="trophy-outline" size={19} color={colors.bloom} />
      </View>

      <View style={styles.flexCopy}>
        <View style={styles.weeklyHeader}>
          <Text variant="bodyStrong" style={styles.flexCopy}>{t(WEEKLY_FEATURED.title)}</Text>
          <View style={styles.compactRow}>
            <Ionicons name="hourglass-outline" size={12} color={colors.bloom} />
            <Text variant="caption" color={colors.bloom}>{t(WEEKLY_FEATURED.endsIn)}</Text>
          </View>
        </View>

        <Text variant="caption" tone="textLight">{t(WEEKLY_FEATURED.desc)}</Text>

        <View style={styles.weeklyProgress}>
          <View style={[styles.progressBg, styles.flexCopy, { backgroundColor: colors.surfaceVariant }]}>
            <View style={[styles.progressFill, { width: `${fraction * 100}%`, backgroundColor: colors.bloom }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textLight }]}>
            {progress}/{WEEKLY_FEATURED.goal}
          </Text>
          <Text style={[styles.xpValue, { color: colors.bloom }]}>+{WEEKLY_FEATURED.xp}</Text>
        </View>
      </View>
    </View>
  );
}
