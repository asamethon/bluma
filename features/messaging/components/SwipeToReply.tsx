import { Radius, alpha, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { useCallback } from 'react';
import type { DirectMessage } from '@/types';

/** Parmağın gitmesi gereken yol ve yanıtın tetiklendiği eşik. */
const MAX_PULL = 72;
const THRESHOLD = 44;

/**
 * Baloncuğu sağa çekince yanıt kipi açılır (WhatsApp/Instagram alışkanlığı).
 * Dikey kaydırma bozulmasın diye jest yalnızca YATAY harekette etkinleşir.
 */
export function SwipeToReply({ message, onReply, children }: {
  message: DirectMessage; onReply: (message: DirectMessage) => void; children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const offset = useSharedValue(0);
  const reply = useCallback(() => onReply(message), [message, onReply]);

  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-14, 14])
    .onUpdate(event => {
      offset.value = Math.min(MAX_PULL, Math.max(0, event.translationX));
    })
    .onEnd(() => {
      if (offset.value >= THRESHOLD) runOnJS(reply)();
      offset.value = withTiming(0, { duration: 160 });
    });

  const row = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const hint = useAnimatedStyle(() => ({
    opacity: Math.min(1, offset.value / THRESHOLD),
    transform: [{ scale: 0.7 + Math.min(1, offset.value / THRESHOLD) * 0.3 }],
  }));

  return (
    <View>
      <Animated.View style={[styles.hint, hint]} pointerEvents="none">
        <View style={[styles.hintBadge, { backgroundColor: alpha(colors.primary, 0.12) }]}>
          <Ionicons name="arrow-undo" size={15} color={colors.primary} />
        </View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={row}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { position: 'absolute', left: -6, top: 0, bottom: 0, justifyContent: 'center' },
  hintBadge: {
    width: 30, height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
});
