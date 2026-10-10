import { Text } from '@/components/ui';
import { CategoryMeta, useTheme } from '@/constants/theme';
import { ONBOARDING_GENRES, type OnboardingGenre } from '@/features/auth/onboarding/constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { onboardingStyles as styles } from '../../styles/onboardingStyles';

type Props = { selected: OnboardingGenre[]; onToggle: (genre: OnboardingGenre) => void };

export function GenresStep({ selected, onToggle }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.genresStep}>
      <Text variant="caption" tone="textSecondary" style={styles.genreCount}>
        {t('onboarding.genresSelected', { count: selected.length })}
      </Text>
      <View style={styles.genreGrid}>
        {ONBOARDING_GENRES.map(genre => {
          const meta = CategoryMeta[genre];
          const active = selected.includes(genre);
          return (
            <TouchableOpacity
              key={genre}
              onPress={() => onToggle(genre)}
              activeOpacity={0.78}
              style={[
                styles.genreCard,
                { backgroundColor: active ? `${meta.color}16` : colors.surface, borderColor: active ? meta.color : colors.border },
              ]}
            >
              <View style={[styles.genreIcon, { backgroundColor: active ? `${meta.color}20` : colors.surfaceVariant }]}>
                <Ionicons name={meta.icon as never} size={22} color={meta.color} />
              </View>
              <Text variant="label" style={[styles.genreLabel, { color: active ? meta.color : colors.text }]}>{t(meta.label)}</Text>
              {active && (
                <View style={[styles.genreCheck, { backgroundColor: meta.color }]}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
