import { useTheme } from '@/constants/theme';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';


function Dot({ delay, color }: { delay: number; color: string }) {
  const v = useSharedValue(0.3);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({ opacity: v.value }));
  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function TypingBubble() {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <View
        style={{
          maxWidth: '78%',
          paddingVertical: 12,
          paddingHorizontal: 14,
          marginBottom: 4,
          backgroundColor: colors.surfaceVariant,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 18,
          flexDirection: 'row',
          gap: 4,
          alignItems: 'center',
        }}
      >
        <Dot delay={0} color={colors.textLight} />
        <Dot delay={150} color={colors.textLight} />
        <Dot delay={300} color={colors.textLight} />
      </View>
    </View>
  );
}
