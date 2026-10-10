import { View, type StyleProp, type ViewStyle } from "react-native";
import { Spacing, useTheme } from "@/constants/theme";
import { Text } from "./Text";

/**
 * Editoryal dilin taşıyıcı öğesi: kartlar yerine çizgi. `inset` satır
 * içeriğiyle hizalanan girinti verir (ör. avatarın solundan başlamasın).
 */
export function Divider({
  inset = 0,
  vertical = false,
  spacing = 0,
  style,
}: {
  inset?: number;
  vertical?: boolean;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, borders } = useTheme();

  if (vertical) {
    return (
      <View
        style={[
          { width: borders.hair, alignSelf: "stretch", backgroundColor: colors.divider, marginHorizontal: spacing },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        { height: borders.hair, backgroundColor: colors.divider, marginLeft: inset, marginVertical: spacing },
        style,
      ]}
    />
  );
}

/** Bölüm arasına giren, ortasında etiket taşıyan ayraç. */
export function LabeledDivider({ label }: { label: string }) {
  const { colors, borders } = useTheme();
  const line = { flex: 1, height: borders.hair, backgroundColor: colors.divider };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
      <View style={line} />
      <Text variant="overline" tone="textLight">{label}</Text>
      <View style={line} />
    </View>
  );
}
