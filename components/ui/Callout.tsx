import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing, alpha, useTheme } from "@/constants/theme";
import { Text } from "./Text";

type Tone = "neutral" | "info" | "warning" | "error" | "success";

/**
 * Bilgi/uyarı notu. Editoryal dilde dolgu değil, solda renkli bir kural ve
 * çok hafif bir zemin — metin akışını kesmeden okunur.
 */
export function Callout({
  children,
  title,
  icon,
  tone = "neutral",
  style,
}: {
  children?: React.ReactNode;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();

  const TONES: Record<Tone, { tint: string; icon: keyof typeof Ionicons.glyphMap }> = {
    neutral: { tint: colors.textLight, icon: "information-circle-outline" },
    info: { tint: colors.primary, icon: "information-circle-outline" },
    warning: { tint: colors.warning, icon: "warning-outline" },
    error: { tint: colors.error, icon: "alert-circle-outline" },
    success: { tint: colors.success, icon: "checkmark-circle-outline" },
  };
  const t = TONES[tone];

  return (
    <View style={[styles.root, { backgroundColor: alpha(t.tint, 0.08), borderLeftColor: t.tint }, style]}>
      <Ionicons name={icon ?? t.icon} size={17} color={t.tint} style={styles.icon} />
      <View style={styles.copy}>
        {!!title && (
          <Text variant="label" color={t.tint}>
            {title}
          </Text>
        )}
        {typeof children === "string" ? (
          <Text variant="caption" tone="textSecondary">
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderLeftWidth: 2,
    borderTopRightRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
  },
  icon: { marginTop: 1 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
});
