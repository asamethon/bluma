import { View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Fonts, Radius, alpha, useTheme } from "@/constants/theme";
import { Text } from "./Text";

/**
 * Kullanıcı görseli. Düz yüzeylerde kenarı belirsizleşmesin diye her zaman
 * hairline kontur taşır; `ring` yalnızca vurgulanmış durumlarda (canlı, yeni).
 */
export function Avatar({
  uri,
  name,
  size = 36,
  ring,
  shape = "circle",
  style,
}: {
  uri?: string;
  name?: string;
  size?: number;
  ring?: boolean;
  shape?: "circle" | "rounded";
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, borders } = useTheme();
  const radius = shape === "circle" ? size / 2 : Math.max(Radius.sm, size * 0.28);

  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const inner = (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: alpha(colors.primary, 0.12),
          borderWidth: borders.hair,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        !ring && style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={uri}
        />
      ) : (
        <Text
          color={colors.primary}
          style={{
            fontFamily: Fonts.sansBold,
            fontSize: size * 0.38,
            lineHeight: size * 0.5,
            includeFontPadding: false,
          }}
        >
          {initials || "?"}
        </Text>
      )}
    </View>
  );

  if (!ring) return inner;

  return (
    <View
      style={[
        {
          padding: 2,
          borderRadius: radius + 3,
          borderWidth: 1.5,
          borderColor: colors.bloom,
        },
        style,
      ]}
    >
      {inner}
    </View>
  );
}
