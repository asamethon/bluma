import { BloomMark } from "@/components/ui/BloomMark";
import { useTheme } from "@/constants/theme";
import { GlassView } from "expo-glass-effect";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

/** iOS 26 aksesuar düğmesi: çubuğun yanında duran, bloom rengine boyanmış cam daire. */
function WriteGlassButton({ size, onPress }: { size: number; onPress: () => void }) {
  const { colors, scheme } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <GlassView
        glassEffectStyle="regular"
        tintColor={colors.bloom}
        colorScheme={scheme}
        isInteractive
        style={{ width: size, height: size, borderRadius: size / 2 }}
      >
        <Pressable
          onPress={onPress}
          onPressIn={() => (scale.value = withSpring(0.92))}
          onPressOut={() => (scale.value = withSpring(1))}
          style={styles.press}
          accessibilityRole="button"
        >
          <BloomMark size={30} color="#FFFFFF" coreColor="#FFFFFF" />
        </Pressable>
      </GlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  press: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
});

export default React.memo(WriteGlassButton);
