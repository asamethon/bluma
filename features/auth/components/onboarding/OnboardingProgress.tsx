import { Text } from '@/components/ui';
import { Fonts, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { onboardingStyles as styles } from '../../styles/onboardingStyles';

type Props = { step: number; total: number; completion: boolean; onBack: () => void };

export function OnboardingProgress({ step, total, completion, onBack }: Props) {
  const { colors } = useTheme();
  const backDisabled = step === 0 || completion;
  return (
    <View style={[styles.progressHeader, { paddingHorizontal: Spacing.screenX }]}>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backCircle, { backgroundColor: colors.surface, opacity: backDisabled ? 0.35 : 1 }]}
        disabled={backDisabled}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${((step + 1) / total) * 100}%` }]} />
      </View>
      <Text variant="caption" tone="textLight" style={[styles.stepCounter, { fontFamily: Fonts.mono }]}>
        {step + 1}/{total}
      </Text>
    </View>
  );
}
