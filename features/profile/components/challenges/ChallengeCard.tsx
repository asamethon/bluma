import { Badge, Button, Divider, Text } from '@/components/ui';
import { alpha, useTheme } from '@/constants/theme';
import { CHALLENGE_DEFS, PILLAR_COLORS } from '@/features/challenges/definitions';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { challengeStyles as styles } from '../../styles/challengeStyles';

type Challenge = typeof CHALLENGE_DEFS[number];
type Props = {
  challenge: Challenge;
  progress: number;
  claimed: boolean;
  last?: boolean;
  onClaim: (id: string) => void;
};

/**
 * Tek meydan okuma. Kart kutusu yok: ikon karesi + künye bloğu, altında
 * hairline ayraç. Hazır olan görev yalnızca aksiyonuyla öne çıkar.
 */
function ChallengeCardComponent({ challenge, progress, claimed, last, onClaim }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const ready = progress >= challenge.goal && !claimed;
  const color = PILLAR_COLORS[challenge.pillar];

  return (
    <View style={{ opacity: claimed ? 0.6 : 1 }}>
      <View style={styles.challengeRow}>
        <View style={[styles.challengeIconWrap, { backgroundColor: alpha(color, 0.14) }]}>
          <Ionicons name={(claimed ? 'checkmark' : challenge.icon) as never} size={20} color={color} />
        </View>

        <View style={styles.flexCopy}>
          <View style={styles.challengeTitleRow}>
            <Text variant="bodyStrong" style={styles.flexCopy}>{t(challenge.title)}</Text>
            <Text style={[styles.xpValue, { color: claimed ? colors.success : colors.textLight }]}>
              +{challenge.xp}
            </Text>
          </View>

          <Text variant="caption" tone="textLight">{t(challenge.desc)}</Text>

          {challenge.badge && !claimed && (
            <View style={styles.badgeRow}>
              <Badge label={t(challenge.badge)} tone="gold" icon="ribbon" />
            </View>
          )}

          <View style={styles.challengeProgressRow}>
            {ready ? (
              <Button label={t('challengesScreen.claimReward')} size="sm" onPress={() => onClaim(challenge.id)} />
            ) : claimed ? (
              <Text variant="label" color={colors.success}>{t('storyStatus.completed')}</Text>
            ) : (
              <>
                <View style={[styles.progressBg, styles.flexCopy, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progress / challenge.goal, 1) * 100}%`, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={[styles.progressLabel, { color: colors.textLight }]}>
                  {challenge.goal > 1 ? `${progress}/${challenge.goal}` : '0/1'}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
      {!last && <Divider inset={40 + 12} />}
    </View>
  );
}

export const ChallengeCard = memo(ChallengeCardComponent);
