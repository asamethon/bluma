import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Motion, Radius, Spacing, useTheme } from "@/constants/theme";
import { Text } from "./Text";

export type SegmentOption =
  | { value: string; label: string; icon?: keyof typeof Ionicons.glyphMap }
  | string;

const valueOf = (o: SegmentOption) => (typeof o === "string" ? o : o.value);

/** Uygulama temasından bağımsız yüzeylerde (okuyucu paleti gibi) renk devri. */
export type SegmentPalette = {
  active?: string;
  inactive?: string;
  indicator?: string;
  surface?: string;
  track?: string;
};

/**
 * Sekme seçici. Editoryal varsayılan `underline`: yüzey kutusu yok, metin
 * sırası ve altındaki ince çizgi seçimi taşır. `solid` yalnızca dar/gömülü
 * bağlamlar için (ör. bir kartın içi).
 */
export function SegmentedControl({
  options = [],
  value,
  onChange,
  appearance = "underline",
  palette,
  style,
}: {
  options: SegmentOption[];
  value: string;
  onChange?: (val: string) => void;
  appearance?: "underline" | "solid";
  palette?: SegmentPalette;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, borders } = useTheme();
  const [width, setWidth] = React.useState(0);
  const tint = {
    active: palette?.active ?? colors.text,
    inactive: palette?.inactive ?? colors.textLight,
    indicator: palette?.indicator ?? colors.primary,
    surface: palette?.surface ?? colors.surface,
    track: palette?.track ?? colors.surfaceVariant,
  };

  const n = options.length || 1;
  const idx = Math.max(0, options.findIndex((o) => valueOf(o) === value));
  const solid = appearance === "solid";
  const pad = solid ? 4 : 0;
  const segW = width > 0 ? (width - pad * 2) / n : 0;

  const x = useSharedValue(0);
  React.useEffect(() => {
    x.value = withTiming(idx * segW, { duration: Motion.base });
  }, [idx, segW, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.root,
        solid
          ? { padding: pad, backgroundColor: tint.track, borderRadius: Radius.md }
          : { borderBottomWidth: borders.hair, borderBottomColor: palette?.track ?? colors.divider },
        style,
      ]}
    >
      {segW > 0 && (
        <Animated.View
          style={[
            solid
              ? {
                  position: "absolute",
                  top: pad,
                  left: pad,
                  bottom: pad,
                  width: segW,
                  borderRadius: Radius.sm,
                  backgroundColor: tint.surface,
                }
              : {
                  position: "absolute",
                  bottom: -borders.hair,
                  left: 0,
                  height: 2,
                  width: segW,
                  backgroundColor: tint.indicator,
                },
            indicator,
          ]}
        />
      )}

      {options.map((o) => {
        const val = valueOf(o);
        const label = typeof o === "string" ? o : o.label;
        const icon = typeof o === "object" ? o.icon : undefined;
        const active = val === value;
        return (
          <Pressable
            key={val}
            onPress={() => onChange?.(val)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.segment,
              { height: solid ? 34 : 44, opacity: pressed ? Motion.pressOpacity : 1 },
            ]}
          >
            {icon && (
              <Ionicons name={icon} size={15} color={active ? tint.active : tint.inactive} />
            )}
            <Text variant="label" color={active ? tint.active : tint.inactive} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignSelf: "stretch" },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: Spacing.xs,
    zIndex: 1,
  },
});
