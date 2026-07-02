import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Fonts, Motion, Radius, Spacing, useTheme } from "@/constants/theme";
import { Text } from "./Text";

type Variant = "primary" | "bloom" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE: Record<Size, { h: number; px: number; font: number; icon: number }> = {
  sm: { h: 38, px: Spacing.lg, font: 13, icon: 16 },
  md: { h: 48, px: Spacing.xl, font: 15, icon: 18 },
  lg: { h: 56, px: Spacing.xxl, font: 16, icon: 20 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const { colors, shadows } = useTheme();
  const scale = useSharedValue(1);
  const dims = SIZE[size];

  const palette: Record<Variant, { bg: string; fg: string; border?: string; glow?: object }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    bloom: { bg: colors.bloom, fg: "#FFFFFF", glow: shadows.bloom },
    secondary: { bg: colors.surfaceVariant, fg: colors.text },
    outline: { bg: "transparent", fg: colors.primary, border: colors.primary },
    ghost: { bg: "transparent", fg: colors.primary },
  };
  const p = palette[variant];

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, fullWidth && { alignSelf: "stretch" }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => (scale.value = withTiming(Motion.pressScale, { duration: Motion.fast }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: Motion.fast }))}
        style={[
          styles.base,
          {
            height: dims.h,
            paddingHorizontal: dims.px,
            backgroundColor: p.bg,
            borderRadius: Radius.pill,
            borderWidth: p.border ? 1.5 : 0,
            borderColor: p.border,
            opacity: disabled ? 0.5 : 1,
          },
          variant === "bloom" && (p.glow as any),
          variant === "primary" && {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={p.fg} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <Ionicons name={icon} size={dims.icon} color={p.fg} />}
            <Text variant="bodyStrong" color={p.fg} style={{ fontSize: dims.font, fontFamily: Fonts.sansBold }}>
              {label}
            </Text>
            {iconRight && <Ionicons name={iconRight} size={dims.icon} color={p.fg} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", flexDirection: "row" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
