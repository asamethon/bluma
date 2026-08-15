import { BloomMark } from "@/components/ui/BloomMark";
import { Fonts, Radius, Spacing, useTheme } from "@/constants/theme";
import { useGuestGate } from "@/contexts/GuestContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAppSelector } from '@/store/hooks';

export const tabsData = [
  { name: "index", title: "tabs.discover", icon: "home", iconOutline: "home-outline" },
  { name: "search", title: "tabs.search", icon: "search", iconOutline: "search-outline" },
  { name: "write", title: "tabs.write", isCenter: true },
  { name: "library", title: "tabs.library", icon: "bookmark", iconOutline: "bookmark-outline" },
  { name: "notifications", hidden: true },
  { name: "profile", title: "tabs.profile", icon: "person", iconOutline: "person-outline" },
];

function TabItem({
  tab,
  focused,
  badge,
  onPress,
}: {
  tab: any;
  focused: boolean;
  badge?: number;
  onPress: () => void;
}) {
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
        <Animated.View style={[styles.activePill, { backgroundColor: colors.primarySoft, borderColor: colors.border }, pillStyle]} />
        <Ionicons name={(focused ? tab.icon : tab.iconOutline) as any} size={23} color={color} />
        {!!badge && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.bloom, borderColor: colors.surface }]}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {t(tab.title)}
      </Text>
    </Pressable>
  );
}

function WriteFab({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const { colors, shadows } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={styles.fabSlot} pointerEvents="box-none">
      <Animated.View style={animStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={() => (scale.value = withSpring(0.9))}
          onPressOut={() => (scale.value = withSpring(1))}
          style={[styles.fab, shadows.bloom]}
        >
          <View style={[styles.fabHalo, { backgroundColor: colors.bloomSoft }]} />
          <BloomMark size={30} color="#FFFFFF" coreColor="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const TAB_BAR_MAX_WIDTH = 480;

export default function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const { colors, scheme, shadows } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const { requireAuth } = useGuestGate();
  const router = useRouter();
  const capped = width > TAB_BAR_MAX_WIDTH;

  return (
    <View style={[styles.host, { paddingBottom: Math.max(bottom, 10) }]} pointerEvents="box-none">
      <View style={[styles.barWrap, shadows.lg, capped && { width: TAB_BAR_MAX_WIDTH, alignSelf: "center" }]}>
        <View style={styles.blurClip}>
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 80}
            tint={scheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, opacity: Platform.OS === "ios" ? 0.7 : 0.92 }]} />
        </View>
        <View style={[styles.bar, { borderColor: colors.border }]}>
          {tabsData.map((tab, index) => {
            if ((tab as any).hidden) return null;
            const focused = state.index === index;
            const onPress = () => {
              if (tab.isCenter && isGuest) {
                const gateOpened = !requireAuth("write");
                if (!gateOpened) {
                  router.push("/(auth)/signup" as any);
                }
                return;
              }
              const event = navigation.emit({ type: "tabPress", target: state.routes[index]?.key, canPreventDefault: true });
              if (!focused && !event?.defaultPrevented) navigation.navigate(tab.name);
            };
            if (tab.isCenter) {
              return <WriteFab key={tab.name} focused={focused} onPress={onPress} />;
            }
            return (
              <TabItem
                key={tab.name}
                tab={tab}
                focused={focused}
                badge={undefined}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
    paddingHorizontal: Spacing.lg,
  },
  barWrap: {
    borderRadius: Radius.xxl,
    overflow: "visible",
  },
  blurClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.xxl,
    overflow: "hidden",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 64,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "visible",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
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
  fabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
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
  fabHalo: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.35,
  },
});
