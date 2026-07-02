import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, useTheme } from "@/constants/theme";

type Tone = "primary" | "bloom" | "gold" | "success" | "warning" | "error" | "neutral";

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
  style?: any;
}) {
  const { colors } = useTheme();

  const TONES: Record<Tone, { soft: [string, string]; solid: [string, string] }> = {
    primary: { soft: [colors.primarySoft, colors.primary], solid: [colors.primary, "#fff"] },
    bloom: { soft: [colors.bloomSoft, colors.bloomDark], solid: [colors.bloom, "#fff"] },
    gold: { soft: [colors.secondaryLight, colors.secondaryDark], solid: [colors.secondary, "#3A2A06"] },
    success: { soft: ["#E4F5EE", colors.success], solid: [colors.success, "#fff"] },
    warning: { soft: ["#FBEEDC", colors.warning], solid: [colors.warning, "#fff"] },
    error: { soft: ["#FBE6E2", colors.error], solid: [colors.error, "#fff"] },
    neutral: { soft: [colors.surfaceVariant, colors.textSecondary], solid: [colors.textSecondary, "#fff"] },
  };

  const t = TONES[tone];
  const [bg, fg] = solid ? t.solid : t.soft;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: Radius.pill,
          backgroundColor: bg,
          alignSelf: "flex-start",
          gap: 4,
        },
        style,
      ]}
    >
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />}
      {icon && <Ionicons name={icon} size={12} color={fg} />}
      <Text style={{ fontSize: 11.5, fontWeight: "700", color: fg, letterSpacing: 0.1, lineHeight: 16 }}>
        {label}
      </Text>
    </View>
  );
}
