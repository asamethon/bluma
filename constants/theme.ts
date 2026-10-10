// Tema kökü. Ölçek tokenları `tokens.ts`, tür kimlikleri `categories.ts`
// içinde; burada renkle birleşip `useTheme()` demetini üretirler.
//
// EDITORIAL DİL: yüzey ayrımı gölgeyle değil çizgiyle yapılır. `surfaces`
// hazır zeminleri (kart, gömme alan, ayraç) tek yerden verir; bileşenler
// kendi kenarlık/arka plan kombinasyonunu uydurmaz.
import { StyleSheet, type ViewStyle } from "react-native";
import { Colors, type ColorScheme, type ThemeColors } from "./Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Borders, Motion, Radius, Spacing, Typography, Fonts, Layout, alpha } from "./tokens";

export * from "./tokens";
export * from "./categories";

const makeSurfaces = (c: ThemeColors) => ({
  /** Varsayılan kart: yüzey + hairline kenarlık. Gölge YOK. */
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.lg,
    borderWidth: Borders.thin,
    borderColor: c.border,
  } as ViewStyle,
  /** Sayfa zemininde duran, kenarlıksız yumuşak blok (input, sekme yuvası). */
  inset: {
    backgroundColor: c.surfaceVariant,
    borderRadius: Radius.md,
  } as ViewStyle,
  /** Yalnızca kontur — dolgu istemeyen ikincil aksiyonlar. */
  outline: {
    backgroundColor: "transparent",
    borderRadius: Radius.lg,
    borderWidth: Borders.thin,
    borderColor: c.border,
  } as ViewStyle,
  /** Liste satırlarını ayıran yatay çizgi. */
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.divider,
  } as ViewStyle,
  /** Medya kutusu — görsel yüklenene kadar nötr zemin. */
  media: {
    backgroundColor: c.surfaceVariant,
    borderRadius: Radius.md,
    overflow: "hidden",
  } as ViewStyle,
});

// Editoryal dilde gölge yalnızca GERÇEKTEN yüzen katmanlarda kullanılır:
// modal, alt sayfa (sheet), yüzen aksiyon. Kartlar ve butonlar düzdür.
const makeShadows = (c: ThemeColors) => ({
  none: {} as ViewStyle,
  /** Kartlar artık düz — anahtar geriye dönük uyumluluk için duruyor. */
  sm: {} as ViewStyle,
  md: {
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 6,
  } as ViewStyle,
  /** Yüzen birincil aksiyon (FAB) — rengin kendi izi. */
  bloom: {
    shadowColor: c.bloom,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  } as ViewStyle,
});

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof Radius;
  borders: typeof Borders;
  layout: typeof Layout;
  surfaces: ReturnType<typeof makeSurfaces>;
  shadows: ReturnType<typeof makeShadows>;
  motion: typeof Motion;
  fonts: typeof Fonts;
  /** Tema rengini opaklıkla tonlar — tonlu rozet/chip zeminleri için. */
  alpha: typeof alpha;
};

const bundle = (scheme: ColorScheme): Theme => ({
  scheme,
  colors: Colors[scheme],
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  borders: Borders,
  layout: Layout,
  surfaces: makeSurfaces(Colors[scheme]),
  shadows: makeShadows(Colors[scheme]),
  motion: Motion,
  fonts: Fonts,
  alpha,
});

const themeBundles: Record<ColorScheme, Theme> = {
  light: bundle("light"),
  dark: bundle("dark"),
};

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? "light") as ColorScheme;
  return themeBundles[scheme];
}
