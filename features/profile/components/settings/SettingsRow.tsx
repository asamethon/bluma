import { ListRow } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { memo } from 'react';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  /** Grubun son satırında ayraç çizilmez. */
  noBorder?: boolean;
  onPress?: () => void;
  right?: ReactNode;
};

export const SettingsRow = memo(function SettingsRow({ icon, label, color, noBorder, onPress, right }: Props) {
  const { colors } = useTheme();
  return (
    <ListRow
      icon={icon}
      iconColor={color}
      title={label}
      destructive={color === colors.error}
      divider={!noBorder}
      onPress={onPress}
      right={right}
    />
  );
});
