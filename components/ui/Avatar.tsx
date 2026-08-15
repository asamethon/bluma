import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Radius, useTheme } from "@/constants/theme";
import { Text } from "./Text";

export function Avatar({
  uri,
  name,
  size = 36,
  ring,
}: {
  uri?: string;
  name?: string;
  size?: number;
  ring?: boolean;
}) {
  const { colors } = useTheme();
  const initials = (name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const inner = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
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
          style={{ fontSize: size * 0.4, lineHeight: size * 0.56, fontWeight: "700", includeFontPadding: false }}
        >
          {initials || "?"}
        </Text>
      )}
    </View>
  );

  if (!ring) return inner;
  return (
    <View
      style={{
        padding: 2,
        borderRadius: Radius.pill,
        borderWidth: 2,
        borderColor: colors.bloom,
      }}
    >
      {inner}
    </View>
  );
}
