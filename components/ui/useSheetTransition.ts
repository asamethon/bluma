import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, type LayoutChangeEvent } from "react-native";
import { Motion } from "@/constants/theme";

/**
 * Sheet kapandıktan sonra iOS'un modalı gerçekten kaldırması için bırakılan pay.
 * Sistem ekranları (galeri, kamera, paylaşım sayfası) kapanmakta olan bir
 * modalın üstünde açılamaz: açılsa bile modalla birlikte yok edilir.
 */
const DISMISS_SETTLE_MS = Platform.OS === "ios" ? 150 : 0;

/**
 * Alt sayfanın açılış/kapanış hareketi.
 *
 * Modal'ın kendi `slide` animasyonu TÜM içeriği birlikte kaydırır; karartı da
 * sayfayla beraber yukarı sürünür ve alttan bir perde çekiliyormuş gibi durur.
 * Bu yüzden hareketi kendimiz kuruyoruz: karartı ekranın TAMAMINDA yerinde
 * belirir (opaklık), sayfa altından yükselir (translateY).
 *
 * `onClosed` sayfa TAMAMEN kapandıktan (modal sökülüp iOS dismiss'i bittikten)
 * sonra çalışır; sistem ekranı açacak akışlar bunu bekler.
 */
export function useSheetTransition(visible: boolean, onClosed?: () => void) {
  const progress = useRef(new Animated.Value(0)).current;
  const height = useRef(0);
  const visibleRef = useRef(visible);
  const closedRef = useRef(onClosed);
  const [mounted, setMounted] = useState(visible);
  const [measured, setMeasured] = useState(false);
  visibleRef.current = visible;
  closedRef.current = onClosed;

  const animate = useCallback((toValue: number) => {
    Animated.timing(progress, {
      toValue,
      duration: toValue ? Motion.slow : Motion.base,
      easing: toValue ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || toValue || visibleRef.current) return;
      setMounted(false);
      setMeasured(false);
      const notify = closedRef.current;
      if (!notify) return;
      // Sayfa arada yeniden açıldıysa aksiyon düşer: aksi halde bu kez
      // AÇILAN sheet'in üstünde sistem ekranı açmaya çalışırdık.
      setTimeout(() => { if (!visibleRef.current) notify(); }, DISMISS_SETTLE_MS);
    });
  }, [progress]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Ölçü zaten alınmışsa (kapanırken yeniden açıldı) hemen geri getir.
      if (measured) animate(1);
      return;
    }
    if (mounted) animate(0);
  }, [animate, measured, mounted, visible]);

  /** Yükseklik ilk çizimde ölçülür; animasyon ancak o zaman başlayabilir. */
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (!next || measured) return;
    height.current = next;
    setMeasured(true);
    animate(1);
  }, [animate, measured]);

  return {
    mounted,
    onLayout,
    backdropStyle: { opacity: progress },
    sheetStyle: {
      opacity: measured ? 1 : 0,
      transform: [{
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [height.current || 320, 0],
        }),
      }],
    },
  };
}
