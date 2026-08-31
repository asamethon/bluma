import { useGuestGate } from "@/contexts/GuestContext";
import { useAppSelector } from "@/store/hooks";
import { useCallback } from "react";

type TabPressEvent = { data: { isPrevented: boolean } };
type ListenerRoute = { name: string };

/** Native tab seçimini bozmadan misafir Yaz aksiyonunu mevcut giriş sheet'ine bağlar. */
export function useNativeTabGate() {
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const { requireAuth } = useGuestGate();

  const screenListeners = useCallback(
    ({ route }: { route: ListenerRoute }) => ({
      tabPress: (event: TabPressEvent) => {
        if (route.name === "write" && event.data.isPrevented) {
          requireAuth("write");
        }
      },
    }),
    [requireAuth]
  );

  return { isWriteDisabled: isGuest, screenListeners };
}
