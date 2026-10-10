import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { CategoryMeta, Motion, Radius, Spacing, alpha, useTheme } from "@/constants/theme";
import { Text } from "./Text";

/**
 * Filtre chip'i. Editoryal dilde kapsül değil, ölçülü köşeli bir etiket:
 * pasifken yalnızca hairline kontur, aktifken tonlu zemin + aynı renk metin.
 */
export function Chip({
  label,
  active,
  color,
  icon,
  count,
  shape = "rounded",
  onPress,
}: {
  label: string;
  active?: boolean;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
  shape?: "rounded" | "pill";
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const tint = color ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? alpha(tint, 0.12) : "transparent",
          borderColor: active ? alpha(tint, 0.45) : colors.border,
          borderRadius: shape === "pill" ? Radius.pill : Radius.sm,
          opacity: pressed ? Motion.pressOpacity : 1,
        },
      ]}
    >
      {/* Tür rengi kimliktir: açıkça renk verildiyse pasifken de korunur. */}
      {icon && <Ionicons name={icon} size={14} color={color ?? (active ? tint : colors.textLight)} />}
      <Text variant="label" color={active ? tint : colors.textSecondary}>
        {label}
      </Text>
      {count != null && (
        <Text variant="labelSm" color={active ? tint : colors.textLight} style={styles.count}>
          {count}
        </Text>
      )}
    </Pressable>
  );
}

export function CategoryChip({
  category,
  active,
  shape,
  onPress,
}: {
  category: string;
  active?: boolean;
  shape?: "rounded" | "pill";
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
      shape={shape}
      onPress={onPress}
    />
  );
}

/** Tür etiketi (kart altı/ayrıntı): yalnızca renkli büyük harf künye. */
export function GenreTag({ category, onDark = false }: { category: string; onDark?: boolean }) {
  const meta = CategoryMeta[category] ?? CategoryMeta.other;
  const { t } = useTranslation();
  return (
    <View style={styles.tag}>
      <Text variant="overline" color={onDark ? "rgba(255,255,255,0.92)" : meta.color}>
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
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  count: { marginLeft: 1 },
  tag: { alignSelf: "flex-start" },
});
