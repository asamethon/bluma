import { BlumaClassicTabs } from "@/features/navigation/components/BlumaClassicTabs";
import { BlumaNativeTabs } from "@/features/navigation/components/BlumaNativeTabs";
import { Platform } from "react-native";

export default function TabsLayout() {
  return Platform.OS === "android" ? <BlumaClassicTabs /> : <BlumaNativeTabs />;
}
