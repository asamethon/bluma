import { Tabs } from "expo-router";
import { BlumaClassicTabBar } from "./BlumaClassicTabBar";

/** Android rotalarını eski özel bottom bar ile kurar. */
export function BlumaClassicTabs() {
  return (
    <Tabs
      tabBar={(props) => <BlumaClassicTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="write" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
