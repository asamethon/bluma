import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Layout, Motion, Radius, Spacing, useTheme } from "@/constants/theme";
import { Text } from "./Text";

/**
 * Eksi / değer / artı üçlüsü. Dokunma hedefleri 44pt (HIG); değer alanı sabit
 * genişliktedir ki rakam değişince satır zıplamasın.
 */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  canDecrement = true,
  canIncrement = true,
  color,
  surface,
  border,
  accessibilityLabel,
}: {
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
  color?: string;
  surface?: string;
  border?: string;
  accessibilityLabel?: string;
}) {
  const { colors, borders } = useTheme();
  const tint = color ?? colors.text;

  const button = (icon: "remove" | "add", onPress: () => void, enabled: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.button, { opacity: !enabled ? 0.3 : pressed ? Motion.pressOpacity : 1 }]}
    >
      <Ionicons name={icon} size={19} color={tint} />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: surface ?? colors.surfaceVariant, borderColor: border ?? "transparent", borderWidth: border ? borders.thin : 0 },
      ]}
    >
      {button("remove", onDecrement, canDecrement)}
      <Text variant="label" color={tint} style={styles.value}>{value}</Text>
      {button("add", onIncrement, canIncrement)}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
  },
  button: { width: Layout.touch, height: Layout.touch, alignItems: "center", justifyContent: "center" },
  value: { minWidth: 30, textAlign: "center" },
});
