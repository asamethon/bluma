import { ListRow } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  last?: boolean;
  danger?: boolean;
  onPress: () => void;
};

export function HelpLinkRow({ icon, label, last, danger, onPress }: Props) {
  return (
    <ListRow icon={icon} title={label} destructive={danger} divider={!last} onPress={onPress} />
  );
}
