import { Text } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}b` : `${n}`;
}

interface ProfileStatCellProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number;
  label: string;
  color: string;
  onPress?: () => void;
}

/** Profil istatistik bar'ındaki tek hücre (hikâye/takipçi/takip/beğeni). */
export function ProfileStatCell({ icon, value, label, color, onPress }: ProfileStatCellProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text variant="heading" style={{ fontSize: 20, lineHeight: 24, fontWeight: '700' }}>{fmt(value)}</Text>
      <Text variant="caption" tone="textLight">{label}</Text>
    </TouchableOpacity>
  );
}
