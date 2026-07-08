import React from "react";
import { View, useWindowDimensions, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Edge = "top" | "bottom";

export interface ScreenProps extends ViewProps {
  /** Which safe-area edges to pad. Defaults to top + bottom. */
  edges?: Edge[];
  /** Caps content width and centers it on wide (tablet) screens. Omit for full-bleed screens. */
  maxContentWidth?: number;
}

/**
 * Screen — a safe-area-aware container that works on iOS *and* Android.
 *
 * Replaces react-native's `SafeAreaView`, which is iOS-only (a no-op on
 * Android). We read real insets from react-native-safe-area-context and apply
 * them as padding, so status-bar / nav-bar spacing is correct on every
 * platform. Requires a `SafeAreaProvider` at the app root.
 */
export function Screen({ edges = ["top", "bottom"], maxContentWidth, style, children, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const capped = maxContentWidth != null && width > maxContentWidth;
  return (
    <View
      style={[
        edges.includes("top") && { paddingTop: insets.top },
        edges.includes("bottom") && { paddingBottom: insets.bottom },
        style,
      ]}
      {...rest}
    >
      {capped ? (
        <View style={{ flex: 1, width: maxContentWidth, alignSelf: "center" }}>{children}</View>
      ) : (
        children
      )}
    </View>
  );
}
