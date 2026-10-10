import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { OnboardingIntent } from '@/features/auth/onboarding/constants';
import { ONBOARDING_INTENTS } from '@/features/auth/onboarding/constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { onboardingStyles as styles } from '../../styles/onboardingStyles';

type Props = { selected: OnboardingIntent | null; onSelect: (intent: OnboardingIntent) => void };

export function IntentStep({ selected, onSelect }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.intentList}>
      {ONBOARDING_INTENTS.map(intent => {
        const active = selected === intent.id;
        return (
          <TouchableOpacity
            key={intent.id}
            onPress={() => onSelect(intent.id)}
            activeOpacity={0.8}
            style={[
              styles.intentCard,
              { backgroundColor: active ? colors.surface : colors.surfaceVariant, borderColor: active ? intent.color : colors.border, borderWidth: 1 },
            ]}
          >
            <View style={[styles.intentIcon, { backgroundColor: active ? intent.color : colors.surface }]}>
              <Ionicons name={intent.icon} size={25} color={active ? '#fff' : intent.color} />
            </View>
            <View style={styles.intentCopy}>
              <Text variant="titleSm">{t(intent.title)}</Text>
              <Text variant="caption" tone="textSecondary" style={styles.intentSubtitle}>{t(intent.sub)}</Text>
            </View>
            <View style={[
              styles.intentCheck,
              { backgroundColor: active ? intent.color : 'transparent', borderColor: active ? intent.color : colors.border, borderWidth: active ? 0 : 2 },
            ]}>
              {active && <Ionicons name="checkmark" size={15} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
