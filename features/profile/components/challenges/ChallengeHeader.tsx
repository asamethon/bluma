import { Badge, PageHeader } from '@/components/ui';
import { CHALLENGE_DEFS } from '@/features/challenges/definitions';
import { useTranslation } from 'react-i18next';
import { formatXp } from './challengeFormat';

type Props = { xp: number; completed: number; onBack: () => void };

export function ChallengeHeader({ xp, completed, onBack }: Props) {
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t('challengesScreen.title')}
      subtitle={t('challengesScreen.completedCount', { done: completed, total: CHALLENGE_DEFS.length })}
      onBack={onBack}
      right={<Badge label={`${formatXp(xp)} XP`} tone="gold" icon="sparkles" />}
    />
  );
}
