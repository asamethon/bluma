import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Radius, useTheme } from "@/constants/theme";
import { Text } from "./Text";

export type SegmentOption =
  | { value: string; label: string; icon?: keyof typeof Ionicons.glyphMap }
  | string;

export function SegmentedControl({
  options = [],
  value,
  onChange,
  style,
}: {
  options: SegmentOption[];
  value: string;
  onChange?: (val: string) => void;
  style?: any;
}) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = React.useState(0);

  const idx = Math.max(
    0,
    options.findIndex((o) => (typeof o === "string" ? o : o.value) === value)
  );

  const pillX = useSharedValue(0);
  const n = options.length || 1;

  React.useEffect(() => {
    if (containerWidth > 0) {
      const segW = (containerWidth - 8) / n;
      pillX.value = withSpring(idx * segW, { stiffness: 420 });
    }
  }, [idx, containerWidth, n, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  const pillW = containerWidth > 0 ? (containerWidth - 8) / n : 0;

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[
        {
          flexDirection: "row",
          padding: 4,
          backgroundColor: colors.surfaceVariant,
          borderRadius: Radius.pill,
        },
        style,
      ]}
    >
      {pillW > 0 && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 4,
              left: 4,
              bottom: 4,
              width: pillW,
              borderRadius: Radius.pill,
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 4,
            },
            pillStyle,
          ]}
        />
      )}
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const icon = typeof o === "object" ? o.icon : undefined;
        const active = val === value;
        return (
          <Pressable
            key={val}
            onPress={() => onChange?.(val)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 38,
              zIndex: 1,
            }}
          >
            {icon && (
              <Ionicons
                name={icon}
                size={16}
                color={active ? "#fff" : colors.textSecondary}
              />
            )}
            <Text
              variant="label"
              color={active ? "#fff" : colors.textSecondary}
              style={{ fontWeight: "700" }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
