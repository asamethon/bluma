import { Fonts, useTheme } from "@/constants/theme";
import type { ClassicTabSlot } from "@/features/navigation/classicTabs";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/** Git geçmişindeki etiketli klasik sekme öğesi. */
function ClassicTabItem({ tab, focused, onPress }: ClassicTabSlot) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pillStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 180 }),
    transform: [{ scale: withSpring(focused ? 1 : 0.5) }],
  }));
  const color = focused ? colors.primary : colors.textLight;

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={t(tab.title)}
    >
      <View style={styles.iconWrap}>
        <Animated.View
          style={[
            styles.activePill,
            { backgroundColor: colors.primarySoft, borderColor: colors.border },
            pillStyle,
          ]}
        />
        <Ionicons
          name={(focused ? tab.icon : tab.iconOutline)!}
          size={23}
          color={color}
        />
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {t(tab.title)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  activePill: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: Fonts.sansBold,
    letterSpacing: 0.2,
  },
});

export default React.memo(ClassicTabItem);
