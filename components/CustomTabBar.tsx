import ClassicTabBar from "@/components/tabbar/ClassicTabBar";
import LiquidGlassTabBar from "@/components/tabbar/LiquidGlassTabBar";
import { TAB_BAR_MAX_WIDTH, tabsData } from "@/components/tabbar/tabsData";
import { useTabSlots } from "@/components/tabbar/useTabSlots";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export { tabsData };

/**
 * iOS 26+ (Liquid Glass mevcutsa) native cam tasarımı, diğer her yerde
 * -Android dahil- mevcut klasik tasarım kullanılır.
 */
const USE_LIQUID_GLASS = Platform.OS === "ios" && isLiquidGlassAvailable();

export default function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const slots = useTabSlots(state, navigation);
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = width > TAB_BAR_MAX_WIDTH ? TAB_BAR_MAX_WIDTH : undefined;

  const Bar = USE_LIQUID_GLASS ? LiquidGlassTabBar : ClassicTabBar;
  return <Bar slots={slots} bottomInset={bottom} maxWidth={maxWidth} />;
}
