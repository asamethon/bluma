import { Text } from '@/components/ui';
import type { ChangePasswordStyles } from '@/features/profile/styles/changePasswordStyles';
import { memo } from 'react';
import { TextInput, View } from 'react-native';

type Props = {
  label: string;
  placeholder?: string;
  styles: ChangePasswordStyles;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
};

export const PasswordField = memo(function PasswordField(props: Props) {
  return (
    <View style={props.styles.field}>
      <Text variant="label" tone="textSecondary" style={props.styles.fieldLabel}>{props.label}</Text>
      <View style={props.styles.fieldBox}>
        <TextInput
          style={props.styles.input}
          value={props.value}
          onChangeText={props.onChange}
          placeholder={props.placeholder}
          secureTextEntry={!props.visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
});
