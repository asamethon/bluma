import { BloomMark } from "@/components/ui/BloomMark";
import { useTheme } from "@/constants/theme";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/** Git geçmişindeki ortada yükselen Yaz FAB'ı. */
function ClassicWriteButton({
  focused,
  onPress,
}: {
  focused: boolean;
  onPress: () => void;
}) {
  const { colors, shadows } = useTheme();
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.slot} pointerEvents="box-none">
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={() => (scale.value = withSpring(0.9))}
          onPressOut={() => (scale.value = withSpring(1))}
          style={[styles.button, shadows.bloom]}
          accessibilityRole="tab"
          accessibilityLabel={t("tabs.write")}
          accessibilityState={{ selected: focused }}
        >
          <View style={[styles.halo, { backgroundColor: colors.bloomSoft }]} />
          <BloomMark size={30} color="#FFFFFF" coreColor="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: "center", justifyContent: "center" },
  button: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "#E8436A",
    shadowColor: "#FF5C8A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  halo: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.35,
  },
});

export default React.memo(ClassicWriteButton);
