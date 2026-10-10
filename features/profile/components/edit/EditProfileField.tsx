import { Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { editProfileFieldStyles as styles } from '../../styles/editProfileFieldStyles';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  required?: boolean;
  counter?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export function EditProfileField({ label, required, counter, icon, value, onChangeText, ...inputProps }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text variant="label" tone="textSecondary">
          {label}{required && <Text variant="label" style={{ color: colors.bloom }}> *</Text>}
        </Text>
        {counter && <Text variant="caption" tone="textLight">{counter}</Text>}
      </View>
      <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textLight} style={styles.icon} />}
        <TextInput
          {...inputProps}
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textLight}
        />
      </View>
    </View>
  );
}

export function EditProfileDivider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}
