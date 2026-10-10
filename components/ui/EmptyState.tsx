import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing, alpha, useTheme } from "@/constants/theme";
import { Button } from "./Button";
import { Text } from "./Text";

/**
 * Boş/hata durumu. Editoryal dilde büyük dekoratif illüstrasyon yerine
 * ölçülü bir ikon, serif başlık ve tek net aksiyon.
 */
export function EmptyState({
  icon = "sparkles-outline",
  title,
  description,
  actionLabel,
  onAction,
  tone,
  compact,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const tint = tone ?? colors.primary;

  return (
    <View style={[styles.root, compact && styles.compact, style]}>
      <View style={[styles.badge, { backgroundColor: alpha(tint, 0.1) }]}>
        <Ionicons name={icon} size={24} color={tint} />
      </View>
      <Text variant="titleSm" center style={styles.title}>
        {title}
      </Text>
      {!!description && (
        <Text variant="body" tone="textSecondary" center style={styles.desc}>
          {description}
        </Text>
      )}
      {!!actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} size="sm" variant="outline" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.huge },
  compact: { paddingVertical: Spacing.xxl },
  badge: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: { marginBottom: Spacing.xs },
  desc: { maxWidth: 320 },
  action: { marginTop: Spacing.xl },
});
