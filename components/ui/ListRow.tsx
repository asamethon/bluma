import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Layout, Motion, Radius, Spacing, alpha, useTheme } from "@/constants/theme";
import { Text } from "./Text";
import { Divider } from "./Divider";

/**
 * Ayar/menü satırı. Editoryal dilde her satır bir kart değildir: satırlar
 * hairline ayraçla dizilir, ikon nötr bir kare içinde durur.
 */
export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  right,
  destructive,
  disabled,
  showChevron = true,
  divider = true,
  onPress,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  right?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  divider?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const tint = destructive ? colors.error : (iconColor ?? colors.primary);
  const titleColor = destructive ? colors.error : colors.text;
  const interactive = !!onPress && !disabled;

  const content = (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.icon, { backgroundColor: alpha(tint, 0.11) }]}>
          <Ionicons name={icon} size={17} color={tint} />
        </View>
      )}

      <View style={styles.copy}>
        <Text variant="bodyStrong" color={titleColor} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text variant="caption" tone="textLight" numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      {!!value && (
        <Text variant="label" tone="textLight" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      )}
      {right}
      {interactive && showChevron && !right && (
        <Ionicons name="chevron-forward" size={17} color={colors.textLight} />
      )}
    </View>
  );

  return (
    <View style={style}>
      {interactive ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? Motion.pressOpacity : 1 })}
        >
          {content}
        </Pressable>
      ) : (
        <View style={{ opacity: disabled ? 0.45 : 1 }}>{content}</View>
      )}
      {divider && <Divider inset={icon ? 34 + Spacing.md : 0} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: Layout.rowMinHeight,
    paddingVertical: Spacing.md,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 2 },
  value: { maxWidth: 140 },
});
