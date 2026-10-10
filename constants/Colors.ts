// Bluma — editoryal lila sistemi.
// Düz (gölgesiz) tasarım dilinde derinliği KENARLIK taşır; bu yüzden
// border/divider tonları yüzeyden net ayrılacak şekilde ayarlanmıştır.
// Lavanta marka kimliği korunur; arayüz yüzeyleri daha nötr, daha net ve daha
// az gölgeli tutulur. Böylece mor renk vurgu olarak kalır, tüm ekranı boyamaz.
//
// NOTE: every key that existed before is preserved (so existing screens keep
// working) — values are retuned and new bloom tokens are added on top.
export const Colors = {
  light: {
    // Primary — deepened, more confident violet (bloom heart)
    primary: '#7057D9',
    primaryDark: '#5138B5',
    primaryLight: '#B9AAED',
    primarySoft: '#EEEAFB',

    // Secondary — warm honey gold (highlights, premium)
    secondary: '#E7B85C',
    secondaryDark: '#B98228',
    secondaryLight: '#FBEDC9',

    // Bloom accent — the signature warm "petal" rose (the recognizable pop)
    bloom: '#DE5B88',
    bloomDark: '#B83D69',
    bloomLight: '#F5B8CD',
    bloomSoft: '#FCECF2',

    // Neutrals — warm "paper & ink"
    background: '#F8F7FC',
    surface: '#FFFEFF',
    surfaceVariant: '#F1EFF7',
    surfaceAlt: '#ECE7FA',

    // Text — ink tones
    text: '#211D2C',
    textSecondary: '#686171',
    textLight: '#938B9F',
    onPrimary: '#FFFFFF',

    // Status
    accent: '#DE5B88',
    readTick: '#8FD9FF', // DM "okundu" mavi çift tik (koyu mor baloncuk üstünde)
    success: '#348D6A',
    warning: '#C9822B',
    error: '#CF5549',

    // Lines & overlays
    border: '#E4DFEC',
    borderStrong: '#CFC7DD',
    divider: '#EDE9F3',
    overlay: 'rgba(36, 31, 46, 0.45)', // scrim for media
    overlayStrong: 'rgba(20, 16, 28, 0.62)',

    // Special
    white: '#FFFFFF',
    black: '#14111A',
    shadow: 'rgba(49, 36, 83, 0.11)',
    scrim: 'rgba(112, 87, 217, 0.09)',
  },
  dark: {
    // Primary — luminous violet for night reading
    primary: '#BCAAF6',
    primaryDark: '#9A84E7',
    primaryLight: '#7867A6',
    primarySoft: '#2A2540',

    secondary: '#E6C77E',
    secondaryDark: '#C9A95E',
    secondaryLight: '#403720',

    bloom: '#EF84A8',
    bloomDark: '#DC628D',
    bloomLight: '#663247',
    bloomSoft: '#35242D',

    // Neutrals — warm near-black "night paper"
    background: '#121116',
    surface: '#1B1921',
    surfaceVariant: '#25222C',
    surfaceAlt: '#272238',

    text: '#F4F1F7',
    textSecondary: '#BBB4C5',
    textLight: '#888091',
    onPrimary: '#1A1426',

    accent: '#EF84A8',
    readTick: '#1B5E96', // açık lavanta baloncuk üstünde okunur koyu mavi
    success: '#5FCB9C',
    warning: '#E6B36A',
    error: '#F0796A',

    border: '#363143',
    borderStrong: '#4C4658',
    divider: '#2E2A38',
    overlay: 'rgba(10, 7, 16, 0.55)',
    overlayStrong: 'rgba(6, 4, 12, 0.72)',

    white: '#FFFFFF',
    black: '#000000',
    shadow: 'rgba(0, 0, 0, 0.34)',
    scrim: 'rgba(188, 170, 246, 0.10)',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
