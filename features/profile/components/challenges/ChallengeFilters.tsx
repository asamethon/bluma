import { Chip } from '@/components/ui';
import { PILLAR_COLORS, type Pillar } from '@/features/challenges/definitions';
import { useTheme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { challengeStyles as styles } from '../../styles/challengeStyles';

export type ChallengeFilter = 'all' | Pillar;
type Props = { value: ChallengeFilter; onChange: (value: ChallengeFilter) => void };

export function ChallengeFilters({ value, onChange }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const filters = [
    { value: 'all', label: t('challengesScreen.filterAll') },
    { value: 'write', label: t('challengesScreen.filterWrite'), icon: 'create-outline' },
    { value: 'read', label: t('challengesScreen.filterRead'), icon: 'book-outline' },
    { value: 'comment', label: t('challengesScreen.filterCommunity'), icon: 'chatbubbles-outline' },
  ] as const;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
      style={styles.filters}
    >
      {filters.map(filter => (
        <Chip
          key={filter.value}
          label={filter.label}
          icon={'icon' in filter ? filter.icon : undefined}
          color={filter.value === 'all' ? colors.primary : PILLAR_COLORS[filter.value]}
          active={value === filter.value}
          onPress={() => onChange(filter.value)}
        />
      ))}
    </ScrollView>
  );
}
