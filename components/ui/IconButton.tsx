import { Radius, useTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Variant = "plain" | "soft" | "sunk" | "bloom";

/** iOS 26 ve üzeri; diğer her yerde `variant` görünümü aynen korunur. */
const LIQUID_GLASS = Platform.OS === "ios" && isLiquidGlassAvailable();

export function IconButton({
  icon,
  onPress,
  variant = "plain",
  size = 40,
  iconSize,
  badge,
  color,
  glass = false,
  glassColorScheme,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: Variant;
  size?: number;
  iconSize?: number;
  badge?: number;
  color?: string;
  /** iOS 26'da Liquid Glass kapsül; değilse `variant` görünümüne düşer. */
  glass?: boolean;
  /** Cam görünümü uygulama temasından bağımsızsa (ör. okuyucu paleti) burada ver. */
  glassColorScheme?: "light" | "dark";
  style?: any;
}) {
  const { colors, scheme } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const SURFACES: Record<Variant, { bg: string; fg: string }> = {
    plain: { bg: "transparent", fg: colors.text },
    soft: { bg: colors.primarySoft, fg: colors.primary },
    sunk: { bg: colors.surfaceVariant, fg: colors.text },
    bloom: { bg: colors.bloomSoft, fg: colors.bloom },
  };

  const surf = SURFACES[variant];
  const onGlass = glass && LIQUID_GLASS;
  const isCircle = onGlass || variant !== "plain";
  const ic = iconSize ?? Math.round(size * 0.55);

  const body = (
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
          // Cam kapsülde zemin GlassView'dan gelir.
          backgroundColor: onGlass ? "transparent" : surf.bg,
          position: "relative",
        },
        !onGlass && style,
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
  );

  if (onGlass) {
    return (
      <Animated.View style={animStyle}>
        {/* `isInteractive`: dokunuşta iOS'un kendi cam parlaması/deformasyonu. */}
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          colorScheme={glassColorScheme ?? scheme}
          style={[{ borderRadius: Radius.pill }, style]}
        >
          {body}
        </GlassView>
      </Animated.View>
    );
  }

  return <Animated.View style={animStyle}>{body}</Animated.View>;
}
