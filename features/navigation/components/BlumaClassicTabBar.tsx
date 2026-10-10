import { Radius, Spacing, useTheme } from "@/constants/theme";
import { CLASSIC_TAB_BAR_MAX_WIDTH } from "@/features/navigation/classicTabs";
import { useClassicTabSlots } from "@/features/navigation/hooks/useClassicTabSlots";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ClassicTabItem from "./ClassicTabItem";
import ClassicWriteButton from "./ClassicWriteButton";

/** Android'de kullanılan, Git geçmişindeki yüzen klasik bottom bar. */
export function BlumaClassicTabBar(props: BottomTabBarProps) {
  const slots = useClassicTabSlots(props);
  const { colors, shadows } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const capped = width > CLASSIC_TAB_BAR_MAX_WIDTH;

  return (
    <View
      style={[styles.host, { paddingBottom: Math.max(bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.barWrap,
          shadows.lg,
          capped && { width: CLASSIC_TAB_BAR_MAX_WIDTH, alignSelf: "center" },
        ]}
      >
        <View
          style={[
            styles.bar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {slots.map((slot) =>
            slot.tab.isWrite ? (
              <ClassicWriteButton
                key={slot.tab.name}
                focused={slot.focused}
                onPress={slot.onPress}
              />
            ) : (
              <ClassicTabItem key={slot.tab.name} {...slot} />
            )
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
    paddingHorizontal: Spacing.lg,
  },
  barWrap: { borderRadius: Radius.xxl, overflow: "visible" },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 64,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "visible",
  },
});
