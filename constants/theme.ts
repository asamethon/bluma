// Bluma design tokens — the single source of truth for the "Bloom" system.
// Screens read these instead of hand-picking magic numbers, which is what keeps
// the whole app feeling like one product.
import { Platform } from "react-native";
import { Colors, type ColorScheme, type ThemeColors } from "./Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// ── Type families ───────────────────────────────────────────────────────────
// Literary serif for the wordmark, story titles and reading body; a clean
// system sans for everything that is UI chrome. Using platform faces keeps the
// bundle light (no font downloads) while still reading as "a books app".
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

// ── Type ramp ────────────────────────────────────────────────────────────────
// Each role bakes in size + line-height + weight + tracking so callers get
// typographically correct text without guessing.
export type TypeRole =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "bodyStrong"
  | "reading" // long-form story body
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
  display:    { fontFamily: Fonts.serif,        fontSize: 40, lineHeight: 52, letterSpacing: -0.8 },
  title:      { fontFamily: Fonts.serif,        fontSize: 28, lineHeight: 38, letterSpacing: -0.28 },
  heading:    { fontFamily: Fonts.serif,        fontSize: 21, lineHeight: 29 },
  subheading: { fontFamily: Fonts.sansBold,     fontSize: 16, lineHeight: 22 },
  body:       { fontFamily: Fonts.sansRegular,  fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: Fonts.sansSemiBold, fontSize: 15, lineHeight: 22 },
  reading:    { fontFamily: Fonts.serifRegular, fontSize: 19, lineHeight: 32 },
  label:      { fontFamily: Fonts.sansSemiBold, fontSize: 13, lineHeight: 18 },
  caption:    { fontFamily: Fonts.sansMedium,   fontSize: 12, lineHeight: 16 },
  overline:   { fontFamily: Fonts.sansBold,     fontSize: 11, lineHeight: 15, letterSpacing: 1.54, textTransform: "uppercase" },
};

// ── Spacing (4pt grid) ────────────────────────────────────────────────────────
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
  // app-level rhythm
  screenX: 20, // default horizontal screen padding
  gutter: 12,
} as const;

// ── Breakpoints — width-based size classes (device-class agnostic, so this
// also correctly degrades iPad Split View / Slide Over back to phone layout) ──
export const Breakpoints = {
  compact: 0,     // phone portrait
  medium: 700,    // iPad mini portrait and up / wide Split View
  expanded: 1024, // iPad standard/Pro portrait and up
} as const;

// ── Content width caps — keeps single-column reading/forms and grids from
// stretching edge-to-edge on tablet ────────────────────────────────────────────
export const ContentMaxWidth = {
  content: 720, // reading column, forms, single-column detail screens
  grid: 1100,   // grid screens (feed, search, studio hub)
} as const;

// ── Radius — soft, petal-like corners ─────────────────────────────────────────
export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

// ── Elevation — bloom-tinted, soft shadows ────────────────────────────────────
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
  // colored glow used under the bloom FAB / primary CTAs
  bloom: {
    shadowColor: c.bloom,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
});

// ── Motion ─────────────────────────────────────────────────────────────────────
export const Motion = {
  fast: 160,
  base: 240,
  slow: 360,
  spring: { damping: 15, stiffness: 160 },
  springSoft: { damping: 18, stiffness: 120 },
  pressScale: 0.96,
} as const;

// ── Category identity ────────────────────────────────────────────────────────
// Each genre gets its own bloom hue + icon so the feed is glanceable and the
// brand "blooms" in many colors. (Used by Chip / StoryCard accents.)
export const CategoryMeta: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  romance: { label: "Romantik", color: "#FF5C8A", icon: "heart" },
  fantasy: { label: "Fantastik", color: "#7C5CD0", icon: "sparkles" },
  mystery: { label: "Gizem", color: "#4C6FE0", icon: "search" },
  drama: { label: "Dram", color: "#C46BA8", icon: "rainy" },
  adventure: { label: "Macera", color: "#2FA98A", icon: "compass" },
  horror: { label: "Korku", color: "#8B5CF6", icon: "skull" },
  comedy: { label: "Komedi", color: "#E6A93F", icon: "happy" },
  poetry: { label: "Şiir", color: "#D9658C", icon: "leaf" },
  sci_fi: { label: "Bilim Kurgu", color: "#2BB3C0", icon: "planet" },
  other: { label: "Diğer", color: "#9A93A8", icon: "ellipsis-horizontal" },
};

export const categoryColor = (cat?: string, fallback = "#7C5CD0") =>
  (cat && CategoryMeta[cat]?.color) || fallback;
export const categoryLabel = (cat?: string) =>
  (cat && CategoryMeta[cat]?.label) || "Diğer";
export const categoryIcon = (cat?: string) =>
  (cat && CategoryMeta[cat]?.icon) || "book";

// ── Theme bundle + hook ────────────────────────────────────────────────────────
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

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? "light") as ColorScheme;
  const colors = Colors[scheme];
  return {
    scheme,
    colors,
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    shadows: makeShadows(colors),
    motion: Motion,
    fonts: Fonts,
  };
}
