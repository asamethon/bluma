import { useEffect } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Radius, Spacing, useTheme } from "@/constants/theme";

/** Yükleme yer tutucusu: parlama yok, yalnızca sakin bir opaklık nefesi. */
export function Skeleton({
  width,
  height = 14,
  radius = Radius.xs,
  color,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  /** Uygulama teması dışında bir yüzeyde duruyorsa (okuyucu paleti gibi). */
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse]);

  const anim = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { width: width ?? "100%", height, borderRadius: radius, backgroundColor: color ?? colors.surfaceVariant },
        anim,
        style,
      ]}
    />
  );
}

/** Hikâye listesi için hazır iskelet satırı. */
export function SkeletonRow() {
  return (
    <View style={{ flexDirection: "row", gap: Spacing.md, paddingVertical: Spacing.sm }}>
      <Skeleton width={58} height={80} radius={Radius.sm} />
      <View style={{ flex: 1, gap: Spacing.sm, paddingTop: Spacing.xs }}>
        <Skeleton width="72%" height={16} />
        <Skeleton width="94%" height={12} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}
