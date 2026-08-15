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
  variant?: TypeRole;
  tone?: ColorToken;
  color?: string;
  center?: boolean;
}

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
