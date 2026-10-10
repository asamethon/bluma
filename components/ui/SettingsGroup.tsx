import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Spacing } from "@/constants/theme";
import { Text } from "./Text";

/** Ayar/menü grubu: büyük harf künye ve altında hairline ayraçlı satırlar. */
export function SettingsGroup({
  title,
  description,
  children,
  style,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.root, style]}>
      {!!title && (
        <Text variant="overline" tone="textLight" style={styles.title}>
          {title}
        </Text>
      )}
      {!!description && (
        <Text variant="caption" tone="textLight" style={styles.description}>
          {description}
        </Text>
      )}
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.section },
  title: { marginBottom: Spacing.xs },
  description: { marginBottom: Spacing.sm },
});
