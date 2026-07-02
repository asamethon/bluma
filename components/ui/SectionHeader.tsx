import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing, useTheme } from "@/constants/theme";
import { Text } from "./Text";

/**
 * SectionHeader — a feed section title with the signature bloom "tick" accent
 * to the left and an optional "Tümü" (see all) affordance.
 */
export function SectionHeader({
  title,
  accent,
  onSeeAll,
}: {
  title: string;
  accent?: string;
  onSeeAll?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        <View style={[styles.tick, { backgroundColor: accent ?? colors.bloom }]} />
        <Text variant="heading">{title}</Text>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <Text variant="label" color={colors.primary}>
            Tümü
          </Text>
          <Ionicons name="chevron-forward" size={15} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenX,
    marginBottom: Spacing.md,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tick: { width: 5, height: 20, borderRadius: Radius.pill },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
});
