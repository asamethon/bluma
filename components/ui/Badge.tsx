import { View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, alpha, useTheme } from "@/constants/theme";
import { Text } from "./Text";

type Tone = "primary" | "bloom" | "gold" | "success" | "warning" | "error" | "neutral";

/**
 * Durum rozeti. Editoryal dilde rozet kapsül değil, küçük ve keskin bir
 * etikettir: tonlu zemin + aynı ailenin koyu metni, ya da tam dolgu.
 */
export function Badge({
  label,
  tone = "primary",
  solid = false,
  icon,
  dot = false,
  style,
}: {
  label: string;
  tone?: Tone;
  solid?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, scheme } = useTheme();
  const tint = 0.13;

  const TONES: Record<Tone, { soft: [string, string]; solid: [string, string] }> = {
    primary: { soft: [alpha(colors.primary, tint), colors.primary], solid: [colors.primary, colors.onPrimary] },
    bloom: { soft: [alpha(colors.bloom, tint), scheme === "dark" ? colors.bloom : colors.bloomDark], solid: [colors.bloom, "#fff"] },
    gold: { soft: [alpha(colors.secondary, tint), colors.secondaryDark], solid: [colors.secondary, "#3A2A06"] },
    success: { soft: [alpha(colors.success, tint), colors.success], solid: [colors.success, "#fff"] },
    warning: { soft: [alpha(colors.warning, tint), colors.warning], solid: [colors.warning, "#fff"] },
    error: { soft: [alpha(colors.error, tint), colors.error], solid: [colors.error, "#fff"] },
    neutral: { soft: [colors.surfaceVariant, colors.textSecondary], solid: [colors.textSecondary, colors.surface] },
  };

  const [bg, fg] = solid ? TONES[tone].solid : TONES[tone].soft;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 5,
          height: 22,
          paddingHorizontal: 8,
          borderRadius: Radius.xs,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {dot && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: fg }} />}
      {icon && <Ionicons name={icon} size={11} color={fg} />}
      <Text variant="labelSm" color={fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Sayaç baloncuğu (okunmamış bildirim, mesaj). Tek yerden ölçülenir. */
export function CountBadge({ count, color }: { count: number; color?: string }) {
  const { colors } = useTheme();
  if (count <= 0) return null;
  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        paddingHorizontal: 5,
        borderRadius: Radius.pill,
        backgroundColor: color ?? colors.bloom,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text variant="labelSm" color="#fff" style={{ fontSize: 10.5, lineHeight: 14 }}>
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}
