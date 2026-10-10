import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { CHALLENGE_DEFS } from '@/features/challenges/definitions';
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
import { WeeklyChallenge } from './WeeklyChallenge';

export function ChallengesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const userId = useAppSelector(state => state.auth.user?.id);
  const xp = useAppSelector(state => state.challenge.xp);
  const streak = useAppSelector(state => state.challenge.streak);
  const progress = useAppSelector(state => state.challenge.challengeProgress);
  const claimed = useAppSelector(state => state.challenge.claimedChallenges);
  const [filter, setFilter] = useState<ChallengeFilter>('all');
  const claimedSet = useMemo(() => new Set(claimed), [claimed]);
  const challenges = useMemo(() => CHALLENGE_DEFS
    .filter(challenge => filter === 'all' || challenge.pillar === filter)
    .sort((left, right) => Number(claimedSet.has(left.id)) - Number(claimedSet.has(right.id))), [claimedSet, filter]);
  const claim = useCallback((challengeId: string) => {
    if (userId) void challengeActions.claimChallenge(userId, challengeId);
  }, [userId]);
  const weeklyProgress = (progress.r1 || 0) + (progress.c1 || 0);

  return (
    <Screen style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ChallengeHeader
        xp={xp}
        completed={claimed.length}
        onBack={router.back}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <RankHero xp={xp} streak={streak} completed={claimed.length} />
        <View style={styles.heroRule} />
        <WeeklyChallenge progress={weeklyProgress} />
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
