import React from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Motion, Radius, useTheme } from "@/constants/theme";

const TRACK_W = 46;
const TRACK_H = 28;
const THUMB = 22;
const TRAVEL = TRACK_W - THUMB - 6;

/** Düz anahtar: gölgesiz, hairline konturlu; hareket kısa bir timing. */
export function Switch({
  checked = false,
  onChange,
  tint,
  disabled = false,
  style,
}: {
  checked?: boolean;
  onChange?: (val: boolean) => void;
  tint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, borders } = useTheme();
  const on = tint ?? colors.primary;

  const progress = useSharedValue(checked ? 1 : 0);
  React.useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, { duration: Motion.base });
  }, [checked, progress]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (!disabled) onChange?.(!checked);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      style={[
        {
          width: TRACK_W,
          height: TRACK_H,
          padding: 3,
          borderRadius: Radius.pill,
          backgroundColor: checked ? on : colors.surfaceVariant,
          borderWidth: borders.thin,
          borderColor: checked ? on : colors.borderStrong,
          justifyContent: "center",
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: checked ? colors.onPrimary : colors.surface,
            borderWidth: borders.hair,
            borderColor: checked ? "transparent" : colors.borderStrong,
          },
          thumbStyle,
        ]}
      />
    </Pressable>
  );
}
