import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Radius, alpha, useTheme } from "@/constants/theme";

type Width = string | number;

/**
 * İnce ilerleme şeridi. Değer sabit bir orandır (0–1) ya da doğrudan bir
 * `Animated` genişliğidir — kaydırma gibi sürekli sinyaller render tetiklemeden
 * (`useNativeDriver: false`) buradan geçer.
 */
export function ProgressBar({
  value,
  color,
  track,
  height = 3,
  style,
}: {
  value: number | Animated.AnimatedInterpolation<Width>;
  color?: string;
  track?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const fill = color ?? colors.primary;
  const width = typeof value === "number"
    ? (`${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const)
    : value;

  return (
    <View
      accessibilityRole="progressbar"
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: track ?? alpha(fill, 0.16) },
        style,
      ]}
    >
      <Animated.View style={{ width, height, borderRadius: height / 2, backgroundColor: fill }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden", borderRadius: Radius.pill },
});
