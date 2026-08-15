import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { CategoryMeta, Radius, Spacing, useTheme } from "@/constants/theme";
import { Text } from "./Text";

export function Chip({
  label,
  active,
  color,
  icon,
  onPress,
}: {
  label: string;
  active?: boolean;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const tint = color ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? tint : colors.surfaceVariant,
          borderColor: active ? tint : colors.border,
        },
      ]}
    >
      {icon && (
        <Ionicons name={icon} size={14} color={active ? "#fff" : tint} />
      )}
      <Text
        variant="label"
        color={active ? "#fff" : colors.textSecondary}
        style={{ fontWeight: "600" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CategoryChip({
  category,
  active,
  onPress,
}: {
  category: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const meta = CategoryMeta[category] ?? CategoryMeta.other;
  const { t } = useTranslation();
  return (
    <Chip
      label={t(meta.label)}
      icon={meta.icon as any}
      color={meta.color}
      active={active}
      onPress={onPress}
    />
  );
}

export function GenreTag({ category }: { category: string }) {
  const meta = CategoryMeta[category] ?? CategoryMeta.other;
  const { t } = useTranslation();
  return (
    <View style={[styles.tag, { backgroundColor: meta.color }]}>
      <Text variant="overline" color="#fff" style={{ fontSize: 9, letterSpacing: 0.8 }}>
        {t(meta.label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
});
