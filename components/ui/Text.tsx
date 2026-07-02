import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { Typography, type TypeRole, useTheme } from "@/constants/theme";

type ColorToken =
  | "text"
  | "textSecondary"
  | "textLight"
  | "primary"
  | "bloom"
  | "onPrimary"
  | "secondary"
  | "success"
  | "error";

export interface TextProps extends RNTextProps {
  /** Type ramp role — picks size/weight/line-height/tracking. */
  variant?: TypeRole;
  /** Semantic color token from the theme. */
  tone?: ColorToken;
  /** Override color directly (wins over `tone`). */
  color?: string;
  center?: boolean;
}

/**
 * Typed text primitive. Every label in the app should flow through this so the
 * type ramp stays consistent — no more ad-hoc fontSize/fontWeight pairs.
 */
export function Text({
  variant = "body",
  tone = "text",
  color,
  center,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const spec = Typography[variant];
  return (
    <RNText
      style={[
        {
          fontFamily: spec.fontFamily,
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          letterSpacing: spec.letterSpacing,
          textTransform: spec.textTransform,
          color: color ?? (colors as any)[tone] ?? colors.text,
        },
        center && { textAlign: "center" },
        style,
      ]}
      {...rest}
    />
  );
}
