import { Text } from '@/components/ui';
import { Motion } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}b` : `${n}`;
}

interface ProfileStatCellProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  value: number;
  label: string;
  color?: string;
  onPress?: () => void;
}

/**
 * İstatistik hücresi: sayı serif, etiket büyük harf künye.
 *
 * Hücreler eşit genişlikte (`flex: 1`) ve içerik SOLA hizalıdır: ilk sayı
 * başlıkla aynı sol rayda başlar, kolon başlangıçları düzenli bir ızgara
 * kurar. Editoryal dilde hizalama ortalamadan daha güçlü bir sinyaldir.
 */
export function ProfileStatCell({ value, label, onPress }: ProfileStatCellProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.cell, { opacity: pressed && onPress ? Motion.pressOpacity : 1 }]}
    >
      <Text variant="titleSm">{fmt(value)}</Text>
      <Text variant="overline" tone="textLight" numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'flex-start', gap: 2 },
});
