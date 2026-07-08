import { useTheme } from '@/constants/theme';
import { EmptyThreadState } from '@/features/messaging/components/EmptyThreadState';
import { ThreadListPane } from '@/features/messaging/components/ThreadListPane';
import { useResponsive } from '@/hooks/useResponsive';
import { Slot, Stack, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const RAIL_WIDTH = 360;

/**
 * Telefonda: expo-router'ın örtük stack'inin açık eşdeğeri — push/pop geçişi
 * ve kaydırarak geri gitme jesti korunur. Tablette: sohbet listesi solda sabit
 * kalır, aktif sohbet (varsa) sağda Slot ile render edilir — sayfa geçişi
 * yerine anlık panel değişimi.
 */
export default function MessagesLayout() {
  const { colors } = useTheme();
  const { isTablet } = useResponsive();
  const pathname = usePathname();
  const hasActiveThread = pathname !== '/messages';

  if (!isTablet) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <View style={[styles.rail, { borderRightColor: colors.border }]}>
        <ThreadListPane />
      </View>
      <View style={{ flex: 1 }}>
        {hasActiveThread ? <Slot /> : <EmptyThreadState />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: RAIL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
