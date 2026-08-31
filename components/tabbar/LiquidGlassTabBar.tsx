import { Spacing, useTheme } from "@/constants/theme";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import GlassTabItem from "./GlassTabItem";
import WriteGlassButton from "./WriteGlassButton";
import type { TabBarViewProps, TabSlot } from "./types";
import { withAlpha } from "./withAlpha";

const BAR_HEIGHT = 60;
const RADIUS = BAR_HEIGHT / 2;
const BAR_PAD = 5;
/** Gösterge kapsülünün sekme yuvası içinde bıraktığı yatay pay. */
const INDICATOR_INSET = 5;
const INDICATOR_HEIGHT = 48;
/** İki cam öğe bu mesafeden itibaren birbirine "akmaya" başlar. */
const MERGE_SPACING = 18;
/** iOS 26 hissi: hızlı otur, ucundan hafif taşsın. */
const SLIDE_SPRING = { damping: 20, stiffness: 230, mass: 0.65 };

/**
 * iOS 26 Liquid Glass sekme çubuğu: yüzen cam kapsül + yanında ayrı bir cam
 * aksiyon düğmesi (aynı GlassContainer içinde oldukları için yaklaşırken
 * birbirine akarlar — UIGlassContainerEffect).
 *
 * Seçim göstergesi tek parçadır ve sekmeler arasında KAYAR; iOS 26 davranışı
 * budur, her sekmede ayrı ayrı belirip kaybolan bir dolgu değil.
 */
export default function LiquidGlassTabBar({ slots, bottomInset, maxWidth }: TabBarViewProps) {
  const { colors, scheme } = useTheme();
  const [barWidth, setBarWidth] = useState(0);

  const center = slots.find((s) => s.tab.isCenter);
  const tabs = slots.filter((s: TabSlot) => !s.tab.isCenter);
  const selected = Math.max(tabs.findIndex((s) => s.focused), 0);

  const slotWidth = barWidth > 0 ? (barWidth - BAR_PAD * 2) / tabs.length : 0;
  const indicatorWidth = Math.max(slotWidth - INDICATOR_INSET * 2, 0);
  const indicatorX = BAR_PAD + selected * slotWidth + INDICATOR_INSET;

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withTiming(slotWidth > 0 ? 1 : 0, { duration: 120 }),
    transform: [{ translateX: withSpring(indicatorX, SLIDE_SPRING) }],
  }));

  const onBarLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.host, { paddingBottom: Math.max(bottomInset, 12) }]} pointerEvents="box-none">
      <GlassContainer
        spacing={MERGE_SPACING}
        style={[styles.container, !!maxWidth && { width: maxWidth, alignSelf: "center" }]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={scheme}
          style={styles.bar}
          onLayout={onBarLayout}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { width: indicatorWidth, backgroundColor: withAlpha(colors.primary, 0.16) },
              indicatorStyle,
            ]}
          />
          {tabs.map((slot) => (
            <GlassTabItem
              key={slot.tab.name}
              {...slot}
              tintColor={slot.focused ? colors.primary : colors.textSecondary}
            />
          ))}
        </GlassView>
        {center && <WriteGlassButton size={BAR_HEIGHT} onPress={center.onPress} />}
      </GlassContainer>
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
  container: { flexDirection: "row", alignItems: "center", gap: 10 },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: BAR_HEIGHT,
    borderRadius: RADIUS,
    paddingHorizontal: BAR_PAD,
  },
  indicator: {
    position: "absolute",
    left: 0,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
  },
});
