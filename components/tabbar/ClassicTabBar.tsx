import { Radius, Spacing, useTheme } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import TabItem from "./TabItem";
import WriteFab from "./WriteFab";
import type { TabBarViewProps } from "./types";

/**
 * Bluma'nın klasik sekme çubuğu: blur + yüzey katmanı, ortada yükseltilmiş FAB.
 * Android'de ve Liquid Glass'ın olmadığı iOS sürümlerinde kullanılır.
 */
export default function ClassicTabBar({ slots, bottomInset, maxWidth }: TabBarViewProps) {
  const { colors, scheme, shadows } = useTheme();

  return (
    <View style={[styles.host, { paddingBottom: Math.max(bottomInset, 10) }]} pointerEvents="box-none">
      <View style={[styles.barWrap, shadows.lg, !!maxWidth && { width: maxWidth, alignSelf: "center" }]}>
        <View style={styles.blurClip}>
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 80}
            tint={scheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.surface, opacity: Platform.OS === "ios" ? 0.7 : 0.92 },
            ]}
          />
        </View>
        <View style={[styles.bar, { borderColor: colors.border }]}>
          {slots.map((slot) =>
            slot.tab.isCenter ? (
              <WriteFab key={slot.tab.name} onPress={slot.onPress} />
            ) : (
              <TabItem key={slot.tab.name} {...slot} />
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
  blurClip: { ...StyleSheet.absoluteFill, borderRadius: Radius.xxl, overflow: "hidden" },
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
