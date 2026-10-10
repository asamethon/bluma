import { useGuestGate } from "@/contexts/GuestContext";
import {
  CLASSIC_TABS,
  type ClassicTabSlot,
} from "@/features/navigation/classicTabs";
import { useAppSelector } from "@/store/hooks";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";

/** JS tab durumunu eski Android çubuğunun çizime hazır sekmelerine dönüştürür. */
export function useClassicTabSlots({
  state,
  navigation,
}: BottomTabBarProps): ClassicTabSlot[] {
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const { requireAuth } = useGuestGate();

  return CLASSIC_TABS.map((tab) => {
    const routeIndex = state.routes.findIndex((route) => route.name === tab.name);
    const route = state.routes[routeIndex];
    const focused = state.index === routeIndex;

    const onPress = () => {
      if (tab.isWrite && isGuest) {
        requireAuth("write");
        return;
      }

      const event = navigation.emit({
        type: "tabPress",
        target: route?.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) navigation.navigate(tab.name);
    };

    return { tab, focused, onPress };
  });
}
