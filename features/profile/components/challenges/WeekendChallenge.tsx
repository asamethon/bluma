import { Button, Text } from '@/components/ui';
import { alpha, useTheme } from '@/constants/theme';
import { WEEKEND_CHALLENGE, WEEKEND_GOAL } from '@/features/challenges/definitions';
import { weekendStatus } from '@/features/challenges/services/challengeCalendar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { challengeStyles as styles } from '../../styles/challengeStyles';

type Props = { progress: number; claimed: boolean; onClaim: () => void };

/**
 * Hafta sonu maratonu — solda tek renkli kural, kalan her şey tipografi.
 * Geri sayım ve ilerleme gerçek Cuma–Pazar penceresinden gelir (eskiden
 * "2 gün" sabit yazıyordu, ilerleme bütün haftadan toplanıyordu ve ödül
 * alınamıyordu).
 */
export function WeekendChallenge({ progress, claimed, onClaim }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const status = weekendStatus();
  const fraction = Math.min(progress / WEEKEND_GOAL, 1);
  const ready = progress >= WEEKEND_GOAL && !claimed;
  const countdown = status.active
    ? status.days === 1 ? t('challenges.weekly.endsToday') : t('challenges.weekly.endsIn', { count: status.days })
    : status.days === 1 ? t('challenges.weekly.startsTomorrow') : t('challenges.weekly.startsIn', { count: status.days });

  return (
    <View style={[styles.weeklyCard, { backgroundColor: alpha(colors.bloom, 0.07), borderLeftColor: colors.bloom }]}>
      <View style={[styles.weeklyIcon, { backgroundColor: alpha(colors.bloom, 0.15) }]}>
        <Ionicons name={claimed ? 'checkmark' : 'trophy-outline'} size={19} color={colors.bloom} />
      </View>

      <View style={styles.flexCopy}>
        <View style={styles.weeklyHeader}>
          <Text variant="bodyStrong" style={styles.flexCopy}>{t(WEEKEND_CHALLENGE.title)}</Text>
          <View style={styles.compactRow}>
            <Ionicons name="hourglass-outline" size={12} color={colors.bloom} />
            <Text variant="caption" color={colors.bloom}>{countdown}</Text>
          </View>
        </View>

        <Text variant="caption" tone="textLight">{t(WEEKEND_CHALLENGE.desc)}</Text>

        <View style={styles.weeklyProgress}>
          {ready ? (
            <Button label={t('challengesScreen.claimReward')} size="sm" onPress={onClaim} />
          ) : claimed ? (
            <Text variant="label" color={colors.success}>{t('storyStatus.completed')}</Text>
          ) : (
            <>
              <View style={[styles.progressBg, styles.flexCopy, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.progressFill, { width: `${fraction * 100}%`, backgroundColor: colors.bloom }]} />
              </View>
              <Text style={[styles.progressLabel, { color: colors.textLight }]}>
                {progress}/{WEEKEND_GOAL}
              </Text>
            </>
          )}
          <Text style={[styles.xpValue, { color: claimed ? colors.success : colors.bloom }]}>+{WEEKEND_CHALLENGE.xp}</Text>
        </View>
      </View>
    </View>
  );
}
