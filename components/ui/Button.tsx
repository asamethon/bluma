import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, Motion, Radius, Spacing, useTheme } from "@/constants/theme";
import { Text } from "./Text";

type Variant = "primary" | "bloom" | "secondary" | "outline" | "ghost" | "danger";
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
  /** Editoryal varsayılan ölçülü köşedir; kapsül yalnızca yüzen aksiyonlarda. */
  shape?: "rounded" | "pill";
  /** Uygulama teması dışında bir zeminde duruyorsa (okuyucu paleti gibi). */
  palette?: { fg?: string; bg?: string; border?: string };
  style?: StyleProp<ViewStyle>;
}

const SIZE: Record<Size, { h: number; px: number; font: number; icon: number; radius: number }> = {
  sm: { h: 36, px: Spacing.md, font: 13, icon: 15, radius: Radius.md },
  md: { h: 46, px: Spacing.xl, font: 14.5, icon: 17, radius: Radius.md },
  lg: { h: 54, px: Spacing.xxl, font: 16, icon: 19, radius: Radius.lg },
};

/**
 * Düz buton: gölge yok, dolgu ya da hairline kontur. Basış geri bildirimi
 * ölçek değil opaklık — editoryal dilde hareket sessizdir.
 */
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
  shape = "rounded",
  palette,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const dims = SIZE[size];

  const variants: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    bloom: { bg: colors.bloom, fg: "#FFFFFF" },
    secondary: { bg: colors.surfaceVariant, fg: colors.text },
    outline: { bg: "transparent", fg: colors.text, border: colors.borderStrong },
    ghost: { bg: "transparent", fg: colors.primary },
    danger: { bg: "transparent", fg: colors.error, border: colors.error },
  };
  const base = variants[variant];
  const p = {
    bg: palette?.bg ?? base.bg,
    fg: palette?.fg ?? base.fg,
    border: palette?.border ?? base.border,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: dims.h,
          paddingHorizontal: dims.px,
          backgroundColor: p.bg,
          borderRadius: shape === "pill" ? Radius.pill : dims.radius,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          opacity: disabled ? 0.4 : pressed ? Motion.pressOpacity : 1,
        },
        fullWidth && styles.full,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={dims.icon} color={p.fg} />}
          <Text
            color={p.fg}
            numberOfLines={1}
            style={{ fontSize: dims.font, fontFamily: Fonts.sansBold, letterSpacing: -0.1 }}
          >
            {label}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={dims.icon} color={p.fg} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", flexDirection: "row" },
  full: { alignSelf: "stretch" },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
});
