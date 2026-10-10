import { Text } from '@/components/ui';
import { Radius, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = {
  disabled: boolean;
  onApplePress: () => void;
  onGooglePress: () => void;
};

export function AuthSocialButtons({ disabled, onApplePress, onGooglePress }: Props) {
  const { colors } = useTheme();
  const buttonStyle = [styles.button, { borderColor: colors.border, backgroundColor: colors.surface }];
  const showApple = Platform.OS === 'ios';

  return (
    <View style={styles.row}>
      {showApple && (
        <TouchableOpacity style={buttonStyle} onPress={onApplePress} disabled={disabled}>
          <Ionicons name="logo-apple" size={20} color={colors.text} />
          <Text variant="label" style={[styles.label, { color: colors.text }]}>Apple</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[buttonStyle, !showApple && styles.fullWidth]}
        onPress={onGooglePress}
        disabled={disabled}
      >
        <Ionicons name="logo-google" size={20} color={colors.text} />
        <Text variant="label" style={[styles.label, { color: colors.text }]}>Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 50, borderRadius: Radius.lg, borderWidth: 1,
  },
  fullWidth: { flex: undefined, width: '100%' },
  label: { fontWeight: '700' },
});
