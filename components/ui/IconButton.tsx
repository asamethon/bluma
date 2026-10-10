import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import { Motion, Radius, alpha, useTheme } from "@/constants/theme";
import { CountBadge } from "./Badge";

type Variant = "plain" | "soft" | "sunk" | "bloom" | "outline";

/** iOS 26 ve üzeri; diğer her yerde `variant` görünümü aynen korunur. */
const LIQUID_GLASS = Platform.OS === "ios" && isLiquidGlassAvailable();

/**
 * İkon aksiyonu. Editoryal dilde kare-yuvarlak (kapsül değil) ve gölgesizdir;
 * basış geri bildirimi opaklıkla verilir.
 */
export function IconButton({
  icon,
  onPress,
  variant = "plain",
  size = 40,
  iconSize,
  badge,
  color,
  disabled,
  accessibilityLabel,
  glass = true,
  glassColorScheme,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: Variant;
  size?: number;
  iconSize?: number;
  badge?: number;
  color?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Varsayılan olarak iOS 26'da Liquid Glass; `false` ile özel olarak kapatılabilir. */
  glass?: boolean;
  /** Cam görünümü uygulama temasından bağımsızsa (ör. okuyucu paleti) burada ver. */
  glassColorScheme?: "light" | "dark";
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, scheme, borders } = useTheme();

  const SURFACES: Record<Variant, { bg: string; fg: string; border?: string }> = {
    plain: { bg: "transparent", fg: colors.text },
    soft: { bg: alpha(colors.primary, 0.11), fg: colors.primary },
    sunk: { bg: colors.surfaceVariant, fg: colors.text },
    bloom: { bg: alpha(colors.bloom, 0.12), fg: colors.bloom },
    outline: { bg: "transparent", fg: colors.text, border: colors.border },
  };

  const surf = SURFACES[variant];
  const onGlass = glass && LIQUID_GLASS;
  const ic = iconSize ?? Math.round(size * 0.5);

  const body = (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: onGlass ? Radius.pill : Radius.md,
          // Cam kapsülde zemin GlassView'dan gelir.
          backgroundColor: onGlass ? "transparent" : surf.bg,
          borderWidth: !onGlass && surf.border ? borders.thin : 0,
          borderColor: surf.border,
          opacity: disabled ? 0.4 : pressed ? Motion.pressOpacity : 1,
        },
        !onGlass && style,
      ]}
    >
      <Ionicons name={icon} size={ic} color={color ?? surf.fg} />
      {badge != null && badge > 0 && (
        <View style={{ position: "absolute", top: 1, right: 1 }}>
          <CountBadge count={badge} />
        </View>
      )}
    </Pressable>
  );

  if (!onGlass) return body;

  return (
    // `isInteractive`: dokunuşta iOS'un kendi cam parlaması/deformasyonu.
    <GlassView
      glassEffectStyle="regular"
      isInteractive
      colorScheme={glassColorScheme ?? scheme}
      // Ölçü açıkça verilir: sütun içinde cam kapsül tüm genişliğe yayılıp
      // yuvarlaklığını kaybetmesin.
      style={[{ width: size, height: size, borderRadius: Radius.pill }, style]}
    >
      {body}
    </GlassView>
  );
}
