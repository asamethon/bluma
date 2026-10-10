import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { Typography, type TypeRole, useTheme } from "@/constants/theme";
import i18n from "@/i18n";

/**
 * CSS `textTransform` yerelden habersizdir: "Beğeni" → "BEĞENI". Türkçede
 * noktalı i büyürken noktasını korur, bu yüzden künye metinlerini JS'te
 * çeviriyoruz. Intl'e bağımlı `toLocaleUpperCase` yerine açık eşleme.
 */
const upperCase = (value: string) =>
  i18n.language?.startsWith("tr")
    ? value.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase()
    : value.toUpperCase();

type ColorToken =
  | "text"
  | "textSecondary"
  | "textLight"
  | "primary"
  | "primaryDark"
  | "bloom"
  | "bloomDark"
  | "onPrimary"
  | "secondary"
  | "secondaryDark"
  | "success"
  | "warning"
  | "error";

export interface TextProps extends RNTextProps {
  variant?: TypeRole;
  tone?: ColorToken;
  color?: string;
  center?: boolean;
  /** Editoryal listelerde ikincil metni tek satıra kısaltmak için kısayol. */
  muted?: boolean;
}

/**
 * Tek tipografi kapısı. Rol seçilir, ölçü/aile/satır yüksekliği tokendan gelir;
 * bileşenler `fontSize`/`lineHeight` uydurmaz.
 */
export function Text({
  variant = "body",
  tone = "text",
  color,
  center,
  muted,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const spec = Typography[variant];
  const resolved = color ?? (muted ? colors.textSecondary : (colors as any)[tone]) ?? colors.text;
  const localized = spec.textTransform === "uppercase" && typeof rest.children === "string";

  return (
    <RNText
      style={[
        {
          fontFamily: spec.fontFamily,
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          letterSpacing: spec.letterSpacing,
          textTransform: localized ? "none" : spec.textTransform,
          color: resolved,
        },
        center && { textAlign: "center" },
        style,
      ]}
      {...rest}
    >
      {localized ? upperCase(rest.children as string) : rest.children}
    </RNText>
  );
}
