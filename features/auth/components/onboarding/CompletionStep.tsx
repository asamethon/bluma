import { BloomMark, Text } from '@/components/ui';
import { CategoryMeta, useTheme } from '@/constants/theme';
import type { OnboardingGenre } from '@/features/auth/onboarding/constants';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { onboardingStyles as styles } from '../../styles/onboardingStyles';

export function CompletionStep({ genres }: { genres: OnboardingGenre[] }) {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.completionWrap}>
      <BloomMark size={108} />
      <Text style={[styles.completionHeading, { fontFamily: fonts.serif, color: colors.text }]}>{t('onboarding.step4Title')}</Text>
      <Text variant="body" tone="textSecondary" style={styles.completionSubtitle}>
        {t('onboarding.completionSub', { count: genres.length })}
      </Text>
      {!!genres.length && (
        <View style={styles.genrePills}>
          {genres.map(genre => (
            <View key={genre} style={[styles.genrePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text variant="labelSm">{t(CategoryMeta[genre].label)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
