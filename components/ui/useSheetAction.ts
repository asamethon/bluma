import { useCallback, useRef } from "react";

/**
 * Sheet kapandıktan SONRA çalışacak aksiyonu tutar.
 *
 * Galeri, kamera ve paylaşım sayfası gibi sistem ekranları iOS'ta kapanmakta
 * olan bir modalın üstünde açılamaz: çağrı sessizce düşer ya da açılan ekran
 * modalla birlikte yok edilir. ("Kitap kapağı galeriden seçilmiyor" hatasının
 * kökü buydu.) Bu yüzden düğmenin aksiyonu doğrudan çağrılmaz; önce sayfa
 * kapatılır, aksiyon `Sheet`'in `onClosed`'ında tetiklenir.
 *
 * Kullanım:
 *   const after = useSheetAction(onClose);
 *   <Sheet visible={visible} onClose={onClose} onClosed={after.run}>
 *     <Pressable onPress={() => after.schedule(onPickGallery)} />
 *   </Sheet>
 */
export function useSheetAction(close: () => void) {
  const pending = useRef<(() => void) | null>(null);

  /** Aksiyonu kuyruğa alır ve sayfayı kapatır. */
  const schedule = useCallback((action: () => void) => {
    pending.current = action;
    close();
  }, [close]);

  /** Sayfa tamamen kapandığında kuyruktaki aksiyonu çalıştırır. */
  const run = useCallback(() => {
    const action = pending.current;
    pending.current = null;
    action?.();
  }, []);

  return { schedule, run };
}
