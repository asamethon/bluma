import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthLabeledInput } from './AuthLabeledInput';

const LABELS = ['', 'auth.pwWeak', 'auth.pwMedium', 'auth.pwGood', 'auth.pwStrong'];
const COLORS = ['transparent', '#E5604F', '#E6B95C', '#46B98A', '#2FA98A'];

type Props = {
  value: string;
  strength: number;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

export function SignUpPasswordField({ value, strength, visible, onChange, onToggleVisibility }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View>
      <AuthLabeledInput
        label={t('auth.passwordLabel')}
        icon="lock-closed-outline"
        value={value}
        onChangeText={onChange}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        right={
          <Pressable onPress={onToggleVisibility}>
            <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textLight} />
          </Pressable>
        }
      />
      {value.length > 0 && (
        <View style={styles.row}>
          <View style={styles.bars}>
            {[1, 2, 3, 4].map(index => (
              <View
                key={index}
                style={[styles.bar, { backgroundColor: index <= strength ? COLORS[strength] : colors.border }]}
              />
            ))}
          </View>
          <Text variant="caption" style={[styles.label, { color: COLORS[strength] }]}>
            {strength > 0 ? t(LABELS[strength]) : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingHorizontal: 4 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontWeight: '700' },
});
