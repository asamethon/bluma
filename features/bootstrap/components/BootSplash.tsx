import { SplashAnimation } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

/**
 * Açılış ekranı, uygulamanın ÜSTÜNDE duran bir perdedir.
 *
 * Daha önce uygulama ağacı `appReady` olana kadar hiç kurulmuyordu; perde
 * kalkınca yönlendirme, sekmeler ve ana ekran sıfırdan monte oluyor, arada
 * boş (beyaz) bir ekran kalıyordu. Şimdi ağaç perdenin arkasında ısınır,
 * perde kalktığında ana ekran çizilmiş olarak karşılar.
 */
export function BootSplash({ visible, onIntroFinished }: { visible: boolean; onIntroFinished: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (visible) return;
    Animated.timing(opacity, { toValue: 0, duration: 320, useNativeDriver: true })
      .start(({ finished }) => { if (finished) setMounted(false); });
  }, [opacity, visible]);

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents={visible ? 'auto' : 'none'}>
      <SplashAnimation onFinish={onIntroFinished} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
});
