import { Fonts, useTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import type { TabSlot } from "./types";

/** Klasik (Android + iOS 26 öncesi) sekme öğesi. */
function TabItem({ tab, focused, badge, onPress }: TabSlot) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pillStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 180 }),
    transform: [{ scale: withSpring(focused ? 1 : 0.5) }],
  }));
  const color = focused ? colors.primary : colors.textLight;

  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="button">
      <View style={styles.iconWrap}>
        <Animated.View
          style={[
            styles.activePill,
            { backgroundColor: colors.primarySoft, borderColor: colors.border },
            pillStyle,
          ]}
        />
        <Ionicons name={(focused ? tab.icon : tab.iconOutline)!} size={23} color={color} />
        {!!badge && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.bloom, borderColor: colors.surface }]}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {t(tab.title!)}
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
  label: { fontSize: 10, lineHeight: 13, fontFamily: Fonts.sansBold, letterSpacing: 0.2 },
  badge: {
    position: "absolute",
    top: -7,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, lineHeight: 12, fontWeight: "800" },
});

export default React.memo(TabItem);
