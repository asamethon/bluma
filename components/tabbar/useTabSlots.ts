import { useGuestGate } from "@/contexts/GuestContext";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import { tabsData } from "./tabsData";
import type { TabSlot } from "./types";

/**
 * Navigasyon durumunu çizime hazır sekme listesine çevirir.
 * Görsel varyantlar (klasik / liquid glass) aynı listeyi tüketir.
 */
export function useTabSlots(state: any, navigation: any): TabSlot[] {
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const { requireAuth } = useGuestGate();
  const router = useRouter();

  return tabsData.flatMap((tab, index) => {
    if (tab.hidden) return [];
    const focused = state.index === index;
    const onPress = () => {
      if (tab.isCenter && isGuest) {
        const gateOpened = !requireAuth("write");
        if (!gateOpened) router.push("/(auth)/signup" as any);
        return;
      }
      const event = navigation.emit({
        type: "tabPress",
        target: state.routes[index]?.key,
        canPreventDefault: true,
      });
      if (!focused && !event?.defaultPrevented) navigation.navigate(tab.name);
    };
    return [{ tab, focused, onPress }];
  });
}
