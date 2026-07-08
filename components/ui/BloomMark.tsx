import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Fonts, useTheme } from "@/constants/theme";

/**
 * BloomMark — Bluma's signature brand mark.
 *
 * A five-petal bloom assembled entirely from rotated rounded Views (no SVG
 * dependency). The name "bluma" reads as "bloom", so the whole identity grows
 * from this single flower: it's the logo, the loading state, and the heart of
 * the Write button in the tab bar.
 */
export function BloomMark({
  size = 28,
  color,
  coreColor,
  petals = 5,
  style,
}: {
  size?: number;
  color?: string;
  coreColor?: string;
  petals?: number;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const petalColor = color ?? colors.bloom;
  const core = coreColor ?? colors.secondary;

  const petalW = size * 0.42;
  const petalH = size * 0.58;
  const radius = size * 0.07;

  return (
    <View
      style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}
    >
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (360 / petals) * i;
        // Two-tone alternating petals give the bloom a little depth.
        const tone = i % 2 === 0 ? petalColor : shade(petalColor, -0.08);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: petalW,
              height: petalH,
              left: (size - petalW) / 2,
              top: (size - petalH) / 2,
              backgroundColor: tone,
              borderTopLeftRadius: petalW / 2,
              borderTopRightRadius: petalW / 2,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius,
              transform: [{ rotate: `${angle}deg` }, { translateY: -size * 0.2 }],
            }}
          />
        );
      })}
      {/* bloom core */}
      <View
        style={{
          position: "absolute",
          width: size * 0.34,
          height: size * 0.34,
          borderRadius: size * 0.17,
          backgroundColor: core,
        }}
      />
    </View>
  );
}

/**
 * BlumaWordmark — the bloom mark locked up with the serif wordmark.
 */
export function BlumaWordmark({
  size = 26,
  color,
  markColor,
  showMark = true,
}: {
  size?: number;
  color?: string;
  markColor?: string;
  showMark?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wordmark}>
      {showMark && <BloomMark size={size * 1.15} color={markColor} />}
      <Text
        style={{
          fontFamily: Fonts.serif,
          fontSize: size,
          lineHeight: size * 1.3,
          fontWeight: "700",
          letterSpacing: 0.5,
          color: color ?? colors.text,
        }}
      >
        bluma
      </Text>
    </View>
  );
}

// Lightweight hex shading so petals can be two-tone without extra deps.
function shade(hex: string, amount: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const num = parseInt(m, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp((num >> 16) + 255 * amount);
  const g = clamp(((num >> 8) & 0xff) + 255 * amount);
  const b = clamp((num & 0xff) + 255 * amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const styles = StyleSheet.create({
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
