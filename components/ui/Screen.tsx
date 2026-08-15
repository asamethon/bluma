import React from "react";
import { View, useWindowDimensions, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Edge = "top" | "bottom";

export interface ScreenProps extends ViewProps {
  edges?: Edge[];
  maxContentWidth?: number;
}

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
