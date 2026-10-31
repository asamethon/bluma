import {
  selectChallengeProgress, selectChallengeStreak, selectChallengeXp, selectClaimedIds, selectWeekendProgress,
} from '@/store/slices/challengeSlice';
import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { CHALLENGE_DEFS, WEEKEND_CHALLENGE } from '@/features/challenges/definitions';
import { challengeActions } from '@/store/challengeStore';
import { useAppSelector } from '@/store/hooks';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { challengeStyles as styles } from '../../styles/challengeStyles';
import { ChallengeCard } from './ChallengeCard';
import { ChallengeFilters, type ChallengeFilter } from './ChallengeFilters';
import { ChallengeHeader } from './ChallengeHeader';
import { RankHero } from './RankHero';
import { WeekendChallenge } from './WeekendChallenge';

export function ChallengesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const userId = useAppSelector(state => state.auth.user?.id);
  const xp = useAppSelector(selectChallengeXp);
  const streak = useAppSelector(selectChallengeStreak);
  const progress = useAppSelector(selectChallengeProgress);
  const claimedIds = useAppSelector(selectClaimedIds);
  const weekendProgress = useAppSelector(selectWeekendProgress);
  const [filter, setFilter] = useState<ChallengeFilter>('all');
  const claimedSet = useMemo(() => new Set(claimedIds), [claimedIds]);
  // Haftalık ödüller her pazartesi yenilenir; sayılan, şu an alınmış olanlar.
  const completed = CHALLENGE_DEFS.filter(challenge => claimedSet.has(challenge.id)).length;
  const challenges = useMemo(() => CHALLENGE_DEFS
    .filter(challenge => filter === 'all' || challenge.pillar === filter)
    .sort((left, right) => Number(claimedSet.has(left.id)) - Number(claimedSet.has(right.id))), [claimedSet, filter]);
  const claim = useCallback((challengeId: string) => {
    if (userId) void challengeActions.claimChallenge(userId, challengeId);
  }, [userId]);

  return (
    <Screen style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ChallengeHeader
        xp={xp}
        completed={completed}
        onBack={router.back}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <RankHero xp={xp} streak={streak} completed={completed} />
        <View style={styles.heroRule} />
        <WeekendChallenge
          progress={weekendProgress}
          claimed={claimedSet.has(WEEKEND_CHALLENGE.id)}
          onClaim={() => claim(WEEKEND_CHALLENGE.id)}
        />
        <ChallengeFilters value={filter} onChange={setFilter} />
        <View style={styles.challengeList}>
          {challenges.map((challenge, index) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              progress={progress[challenge.id] || 0}
              claimed={claimedSet.has(challenge.id)}
              last={index === challenges.length - 1}
              onClaim={claim}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
