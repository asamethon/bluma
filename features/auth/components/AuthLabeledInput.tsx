import { TextField } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import type { TextInputProps } from 'react-native';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  value: string;
  onChangeText: (value: string) => void;
  right?: ReactNode;
};

/** Kimlik formlarının alanı — görsel dil kit'teki TextField'dan gelir. */
export function AuthLabeledInput({ label, icon, value, onChangeText, right, ...props }: Props) {
  return (
    <TextField
      {...props}
      label={label}
      icon={icon}
      value={value}
      onChangeText={onChangeText}
      right={right}
    />
  );
}
