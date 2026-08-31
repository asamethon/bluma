import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { TabSlot } from "./types";

const ICON_SIZE = 26;

type Props = TabSlot & { tintColor: string };

/**
 * iOS 26 cam çubuğundaki sekme: native SF Symbol + sistem yazı tipiyle etiket.
 * Seçim göstergesi burada DEĞİL — iOS 26'da tek bir kapsül sekmeler arasında
 * akar, o yüzden göstergeyi LiquidGlassTabBar tutar.
 */
function GlassTabItem({ tab, focused, badge, onPress, tintColor }: Props) {
  const { t } = useTranslation();
  const symbol = (focused ? tab.symbol : tab.symbolOutline) ?? tab.symbolOutline;

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
    >
      <View style={styles.iconWrap}>
        <SymbolView
          name={symbol!}
          size={ICON_SIZE}
          tintColor={tintColor}
          weight={focused ? "semibold" : "regular"}
          fallback={
            <Ionicons
              name={(focused ? tab.icon : tab.iconOutline)!}
              size={ICON_SIZE - 2}
              color={tintColor}
            />
          }
        />
        {!!badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>
      {/* Sistem yazı tipi (San Francisco) — iOS 26 sekme etiketleri 10pt medium. */}
      <Text
        style={[styles.label, { color: tintColor, fontWeight: focused ? "600" : "500" }]}
        numberOfLines={1}
      >
        {t(tab.title!)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 1, height: "100%" },
  iconWrap: { alignItems: "center", justifyContent: "center", height: ICON_SIZE },
  label: { fontSize: 10, lineHeight: 13 },
  badge: {
    position: "absolute",
    top: -2,
    right: -9,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, lineHeight: 12, fontWeight: "700" },
});

export default React.memo(GlassTabItem);
