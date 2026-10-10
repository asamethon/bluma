import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { cancelAnimation, Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { registerRemovalAnimation } from '../services/messageRemovalAnimation';
import type { DustSnapshot } from '../utils/messageDust';

type Dust = DustSnapshot & { finish: () => void };

export function useMessageDissolve(threadId: string, messageId: string, mine: boolean) {
  const target = useRef<View>(null);
  const [dust, setDust] = useState<Dust | null>(null);
  const rowHeight = useSharedValue(-1);
  const collapseStyle = useAnimatedStyle(() => ({
    height: rowHeight.value < 0 ? undefined : rowHeight.value,
  }));

  // Dış animasyon komutlarına abonelik; FlashList satırı geri dönüştürünce kapanır.
  useEffect(() => {
    const lifetime = { active: true, finish: () => {}, running: false, reduceMotion: true };
    const cancel = () => {
      cancelAnimation(rowHeight);
      rowHeight.value = -1;
      lifetime.finish();
      target.current?.setNativeProps({ style: { opacity: 1 } });
      if (lifetime.active) setDust(null);
    };
    const play = () => new Promise<void>(resolve => {
      if (lifetime.running) { resolve(); return; }
      lifetime.running = true;
      const animation = { active: true, collapsing: false };
      // Yakalama/WebView başarısız olsa da satır takılı kalmaz.
      const timeout = setTimeout(() => { cancel(); }, 3200);
      const complete = () => {
        if (!animation.active) return;
        animation.active = false;
        lifetime.running = false;
        clearTimeout(timeout);
        resolve();
      };
      lifetime.finish = complete;
      void (async () => {
        lifetime.reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        if (Platform.OS === 'web' || lifetime.reduceMotion) { cancel(); return; }
        const view = target.current;
        if (!view || !lifetime.active || !animation.active) { cancel(); return; }
        const size = await new Promise<{ width: number; height: number }>(done => {
          view.measure((_x, _y, width, height) => done({ width, height }));
        });
        if (size.width <= 0 || size.height <= 0 || size.height > 1800) { cancel(); return; }
        const uri = await captureRef(view, { format: 'png', result: 'data-uri', ...size });
        if (lifetime.active && animation.active) setDust({
          uri, ...size, direction: mine ? -1 : 1,
          finish: () => {
            if (!animation.active || animation.collapsing) return;
            animation.collapsing = true;
            // Liste satırı henüz silinmez. Gerçek yüksekliği UI iş parçacığında
            // sıfıra iner; FlashList komşuları küçülen boşluğa adım adım taşır.
            rowHeight.value = size.height;
            rowHeight.value = withTiming(0, {
              duration: 460,
              easing: Easing.bezier(0.22, 1, 0.36, 1),
              reduceMotion: ReduceMotion.System,
            }, finished => { if (finished) runOnJS(complete)(); });
          },
        });
      })().catch(cancel);
    });
    const unregister = registerRemovalAnimation(threadId, messageId, { play, cancel });
    return () => { lifetime.active = false; unregister(); };
  }, [threadId, messageId, mine, rowHeight]);

  return { target, dust, collapseStyle };
}
