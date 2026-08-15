import { Colors, type ColorScheme, type ThemeColors } from "./Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import i18n from "@/i18n";

export const Fonts = {
  serif: "Spectral_700Bold",
  serifRegular: "Spectral_400Regular",
  serifItalic: "Spectral_400Regular_Italic",
  serifBoldItalic: "Spectral_700Bold_Italic",
  sans: "HankenGrotesk_400Regular",
  sansRegular: "HankenGrotesk_400Regular",
  sansMedium: "HankenGrotesk_500Medium",
  sansSemiBold: "HankenGrotesk_600SemiBold",
  sansBold: "HankenGrotesk_700Bold",
  sansExtraBold: "HankenGrotesk_800ExtraBold",
  mono: "SpaceMono",
};

export type TypeRole =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "bodyStrong"
  | "reading"
  | "label"
  | "caption"
  | "overline";

export const Typography: Record<
  TypeRole,
  {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing?: number;
    textTransform?: "uppercase" | "none";
  }
> = {
  display: { fontFamily: Fonts.serif, fontSize: 40, lineHeight: 52, letterSpacing: -0.8 },
  title: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 38, letterSpacing: -0.28 },
  heading: { fontFamily: Fonts.serif, fontSize: 21, lineHeight: 29 },
  subheading: { fontFamily: Fonts.sansBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: Fonts.sansRegular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: Fonts.sansSemiBold, fontSize: 15, lineHeight: 22 },
  reading: { fontFamily: Fonts.serifRegular, fontSize: 19, lineHeight: 32 },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 15, letterSpacing: 1.54, textTransform: "uppercase" },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  screenX: 20,
  gutter: 12,
} as const;

export const Breakpoints = {
  compact: 0,
  medium: 700,
  expanded: 1024,
} as const;

export const ContentMaxWidth = {
  content: 720,
  grid: 1100,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const makeShadows = (c: ThemeColors) => ({
  none: {},
  sm: {
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 12,
  },
  bloom: {
    shadowColor: c.bloom,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
});

export const Motion = {
  fast: 160,
  base: 240,
  slow: 360,
  spring: { damping: 15, stiffness: 160 },
  springSoft: { damping: 18, stiffness: 120 },
  pressScale: 0.96,
} as const;

export const CategoryMeta: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  romance: { label: "genres.romance", color: "#FF5C8A", icon: "heart" },
  fantasy: { label: "genres.fantasy", color: "#7C5CD0", icon: "sparkles" },
  mystery: { label: "genres.mystery", color: "#4C6FE0", icon: "search" },
  drama: { label: "genres.drama", color: "#C46BA8", icon: "rainy" },
  adventure: { label: "genres.adventure", color: "#2FA98A", icon: "compass" },
  horror: { label: "genres.horror", color: "#8B5CF6", icon: "skull" },
  comedy: { label: "genres.comedy", color: "#E6A93F", icon: "happy" },
  poetry: { label: "genres.poetry", color: "#D9658C", icon: "leaf" },
  sci_fi: { label: "genres.sci_fi", color: "#2BB3C0", icon: "planet" },
  other: { label: "genres.other", color: "#9A93A8", icon: "ellipsis-horizontal" },
};

export const categoryColor = (cat?: string, fallback = "#7C5CD0") =>
  (cat && CategoryMeta[cat]?.color) || fallback;
export const categoryLabel = (cat?: string) =>
  i18n.t((cat && CategoryMeta[cat]?.label) || "genres.other");
export const categoryIcon = (cat?: string) =>
  (cat && CategoryMeta[cat]?.icon) || "book";

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: ReturnType<typeof makeShadows>;
  motion: typeof Motion;
  fonts: typeof Fonts;
};

const themeBundles: Record<ColorScheme, Theme> = {
  light: {
    scheme: "light",
    colors: Colors.light,
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    shadows: makeShadows(Colors.light),
    motion: Motion,
    fonts: Fonts,
  },
  dark: {
    scheme: "dark",
    colors: Colors.dark,
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    shadows: makeShadows(Colors.dark),
    motion: Motion,
    fonts: Fonts,
  },
};

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? "light") as ColorScheme;
  return themeBundles[scheme];
}
