// Bluma "Editorial" tasarım dili — ölçek/ritim tokenları.
//
// İlke: derinlik gölgeyle değil, ÇİZGİ ve BOŞLUKLA kurulur. Kartlar yüzeyden
// 1px hairline ile ayrılır; renk yalnızca anlam taşır (kategori, durum, aksiyon).
// Serif (Spectral) yalnızca editoryal başlık/okuma alanlarında; arayüz metinleri
// sans (Hanken Grotesk).
import { StyleSheet } from "react-native";

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
  | "titleSm"
  | "storyTitle"
  | "heading"
  | "subheading"
  | "body"
  | "bodyLg"
  | "bodyStrong"
  | "reading"
  | "label"
  | "labelSm"
  | "caption"
  | "overline";

type TypeSpec = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: "uppercase" | "none";
};

// lineHeight/fontSize oranı her rolde >= 1.3 — Türkçe aksanlı harfler (Ğ, Ş, İ)
// özel fontlarda daha dar satırlarda tepeden kırpılıyor.
export const Typography: Record<TypeRole, TypeSpec> = {
  display: { fontFamily: Fonts.serif, fontSize: 40, lineHeight: 52, letterSpacing: -1.1 },
  title: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 37, letterSpacing: -0.5 },
  titleSm: { fontFamily: Fonts.serif, fontSize: 21, lineHeight: 28, letterSpacing: -0.3 },
  storyTitle: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  heading: { fontFamily: Fonts.sansBold, fontSize: 19, lineHeight: 25, letterSpacing: -0.35 },
  subheading: { fontFamily: Fonts.sansSemiBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.15 },
  body: { fontFamily: Fonts.sansRegular, fontSize: 15, lineHeight: 23 },
  bodyLg: { fontFamily: Fonts.sansRegular, fontSize: 16.5, lineHeight: 26, letterSpacing: -0.1 },
  bodyStrong: { fontFamily: Fonts.sansSemiBold, fontSize: 15, lineHeight: 23, letterSpacing: -0.1 },
  reading: { fontFamily: Fonts.serifRegular, fontSize: 19, lineHeight: 32 },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 13, lineHeight: 18, letterSpacing: -0.05 },
  labelSm: { fontFamily: Fonts.sansSemiBold, fontSize: 11.5, lineHeight: 16 },
  caption: { fontFamily: Fonts.sansMedium, fontSize: 12.5, lineHeight: 17 },
  overline: {
    fontFamily: Fonts.sansBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
};

// 4pt tabanlı ölçek. `screenX` ve `section` düzen ritmini tek yerden kurar.
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
  section: 34,
} as const;

// Editoryal dilde köşeler ölçülüdür: kart 16, medya 12–20, pill yalnızca
// etiket/chip/avatar gibi "rozet" karakterli parçalarda.
export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  pill: 999,
} as const;

export const Borders = {
  hair: StyleSheet.hairlineWidth,
  thin: 1,
  thick: 1.5,
} as const;

export const Layout = {
  /** Minimum dokunma hedefi (Apple HIG). */
  touch: 44,
  hitSlop: 8,
  cardPad: 16,
  rowMinHeight: 56,
  headerHeight: 56,
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

// Editoryal hareket: yaylanma yok, kısa timing var. Basış geri bildirimi
// ölçekten çok opaklıkla verilir.
export const Motion = {
  fast: 120,
  base: 200,
  slow: 320,
  spring: { damping: 18, stiffness: 200 },
  springSoft: { damping: 20, stiffness: 140 },
  pressScale: 0.985,
  pressOpacity: 0.55,
} as const;

/** `#RRGGBB` + 0–1 opaklık → `#RRGGBBAA`. Tonlu yüzeyleri tek yerden üretir. */
export function alpha(hex: string, opacity: number): string {
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}
