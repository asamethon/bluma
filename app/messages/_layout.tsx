import { useTheme } from '@/constants/theme';
import { ThreadListPane } from '@/features/messaging/components/ThreadListPane';
import { useResponsive } from '@/hooks/useResponsive';
import { Slot, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const RAIL_WIDTH = 360;

export default function MessagesLayout() {
  const { colors } = useTheme();
  const { isTablet } = useResponsive();

  if (!isTablet) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <View style={[styles.rail, { borderRightColor: colors.border }]}>
        <ThreadListPane />
      </View>
      <View style={{ flex: 1 }}>
        <Slot />
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
