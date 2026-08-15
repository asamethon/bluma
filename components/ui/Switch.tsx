import React from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Radius, useTheme } from "@/constants/theme";

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
  style?: any;
}) {
  const { colors } = useTheme();
  const thumbX = useSharedValue(checked ? 20 : 0);
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  React.useEffect(() => {
    thumbX.value = withSpring(checked ? 20 : 0, { damping: 15, stiffness: 160 });
  }, [checked, thumbX]);

  return (
    <Pressable
      onPress={() => {
        if (!disabled) onChange?.(!checked);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      style={[
        {
          width: 50,
          height: 30,
          padding: 3,
          borderRadius: Radius.pill,
          backgroundColor: checked ? (tint ?? colors.primary) : colors.surfaceVariant,
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 3,
          },
          thumbStyle,
        ]}
      />
    </Pressable>
  );
}
