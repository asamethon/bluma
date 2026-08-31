import type { TabDef } from "./types";

/** Sıra, app/(tabs)/_layout.tsx içindeki Tabs.Screen sırasıyla birebir aynı olmalı. */
export const tabsData: TabDef[] = [
  {
    name: "index",
    title: "tabs.discover",
    icon: "home",
    iconOutline: "home-outline",
    symbol: "house.fill",
    symbolOutline: "house",
  },
  {
    name: "search",
    title: "tabs.search",
    icon: "search",
    iconOutline: "search-outline",
    symbol: "magnifyingglass",
    symbolOutline: "magnifyingglass",
  },
  { name: "write", title: "tabs.write", isCenter: true },
  {
    name: "library",
    title: "tabs.library",
    icon: "bookmark",
    iconOutline: "bookmark-outline",
    symbol: "bookmark.fill",
    symbolOutline: "bookmark",
  },
  { name: "notifications", hidden: true },
  {
    name: "profile",
    title: "tabs.profile",
    icon: "person",
    iconOutline: "person-outline",
    symbol: "person.fill",
    symbolOutline: "person",
  },
];

export const TAB_BAR_MAX_WIDTH = 480;
