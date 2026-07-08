import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Radius, useTheme } from "@/constants/theme";

type Variant = "plain" | "soft" | "sunk" | "bloom";

export function IconButton({
  icon,
  onPress,
  variant = "plain",
  size = 40,
  iconSize,
  badge,
  color,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: Variant;
  size?: number;
  iconSize?: number;
  badge?: number;
  color?: string;
  style?: any;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const SURFACES: Record<Variant, { bg: string; fg: string }> = {
    plain: { bg: "transparent", fg: colors.text },
    soft: { bg: colors.primarySoft, fg: colors.primary },
    sunk: { bg: colors.surfaceVariant, fg: colors.text },
    bloom: { bg: colors.bloomSoft, fg: colors.bloom },
  };

  const surf = SURFACES[variant];
  const isCircle = variant !== "plain";
  const ic = iconSize ?? Math.round(size * 0.55);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = withTiming(0.88, { duration: 110 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 160 }))}
        style={[
          {
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: isCircle ? Radius.pill : Radius.sm,
            backgroundColor: surf.bg,
            position: "relative",
          },
          style,
        ]}
      >
        <Ionicons name={icon} size={ic} color={color ?? surf.fg} />
        {badge != null && badge > 0 && (
          <View
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 3,
              borderRadius: 9,
              backgroundColor: colors.bloom,
              borderWidth: 2,
              borderColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 9, lineHeight: 12, fontWeight: "800" }}>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
