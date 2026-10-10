import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type ClassicTabDefinition = {
  name: "index" | "search" | "write" | "library" | "profile";
  title: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  iconOutline?: ComponentProps<typeof Ionicons>["name"];
  isWrite?: boolean;
};

export type ClassicTabSlot = {
  tab: ClassicTabDefinition;
  focused: boolean;
  onPress: () => void;
};

export const CLASSIC_TABS: ClassicTabDefinition[] = [
  {
    name: "index",
    title: "tabs.home",
    icon: "home",
    iconOutline: "home-outline",
  },
  {
    name: "search",
    title: "tabs.search",
    icon: "search",
    iconOutline: "search-outline",
  },
  { name: "write", title: "tabs.write", isWrite: true },
  {
    name: "library",
    title: "tabs.library",
    icon: "bookmark",
    iconOutline: "bookmark-outline",
  },
  {
    name: "profile",
    title: "tabs.profile",
    icon: "person",
    iconOutline: "person-outline",
  },
];

export const CLASSIC_TAB_BAR_MAX_WIDTH = 480;
