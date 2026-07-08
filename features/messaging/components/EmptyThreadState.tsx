import { BloomMark, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import React from 'react';
import { View } from 'react-native';

/** Tablette master-detail sağ panelinde, henüz bir sohbet seçilmemişken gösterilir. */
export function EmptyThreadState() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <BloomMark size={48} color={colors.primaryLight} coreColor={colors.bloomLight} />
      <Text variant="body" tone="textLight">Bir sohbet seç</Text>
    </View>
  );
}
