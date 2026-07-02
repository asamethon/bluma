// Bluma — "where stories bloom"
// Bloom palette: a confident lavender-violet heritage, a signature warm "petal"
// rose accent, and warm paper/ink neutrals for a literary reading feel.
//
// NOTE: every key that existed before is preserved (so existing screens keep
// working) — values are retuned and new bloom tokens are added on top.
export const Colors = {
  light: {
    // Primary — deepened, more confident violet (bloom heart)
    primary: '#7C5CD0', // bloom violet
    primaryDark: '#5E3FB0', // pressed / deep violet
    primaryLight: '#C9BCF2', // soft violet wash
    primarySoft: '#EFEAFB', // tint surface for violet chips/fills

    // Secondary — warm honey gold (highlights, premium)
    secondary: '#E6B95C', // honey gold
    secondaryDark: '#C99A3F',
    secondaryLight: '#F6E6B8',

    // Bloom accent — the signature warm "petal" rose (the recognizable pop)
    bloom: '#FF5C8A', // petal rose
    bloomDark: '#E03E70',
    bloomLight: '#FFD3E0',
    bloomSoft: '#FFEDF2',

    // Neutrals — warm "paper & ink"
    background: '#FBF8F3', // ivory paper
    surface: '#FFFFFF', // raised card
    surfaceVariant: '#F4EFE6', // sunk surface / wells
    surfaceAlt: '#F0EAFA', // faint violet-tinted surface

    // Text — ink tones
    text: '#241F2E', // deep ink (slight violet)
    textSecondary: '#6B6478', // muted ink
    textLight: '#9A93A8', // faint ink
    onPrimary: '#FFFFFF',

    // Status
    accent: '#FF5C8A', // alias of bloom (kept for back-compat)
    success: '#46B98A',
    warning: '#E6A455',
    error: '#E5604F',

    // Lines & overlays
    border: '#ECE5DA',
    borderStrong: '#DDD3C5',
    divider: '#F0EAE0',
    overlay: 'rgba(36, 31, 46, 0.45)', // scrim for media
    overlayStrong: 'rgba(20, 16, 28, 0.62)',

    // Special
    white: '#FFFFFF',
    black: '#15121C',
    shadow: 'rgba(60, 40, 100, 0.16)', // bloom-tinted shadow
    scrim: 'rgba(124, 92, 208, 0.10)',
  },
  dark: {
    // Primary — luminous violet for night reading
    primary: '#B9A4F2',
    primaryDark: '#9A82E0',
    primaryLight: '#6D5AA0',
    primarySoft: '#2A2440',

    secondary: '#E6C77E',
    secondaryDark: '#C9A95E',
    secondaryLight: '#403720',

    bloom: '#FF85A8',
    bloomDark: '#FF5C8A',
    bloomLight: '#5C2A3C',
    bloomSoft: '#33222B',

    // Neutrals — warm near-black "night paper"
    background: '#141119', // ink night
    surface: '#1E1A26', // raised card
    surfaceVariant: '#2A2533', // sunk surface
    surfaceAlt: '#241F33',

    text: '#F3EFF8',
    textSecondary: '#BDB5CC',
    textLight: '#857C96',
    onPrimary: '#1A1426',

    accent: '#FF85A8',
    success: '#5FCB9C',
    warning: '#E6B36A',
    error: '#F0796A',

    border: '#332D40',
    borderStrong: '#453E55',
    divider: '#2A2533',
    overlay: 'rgba(10, 7, 16, 0.55)',
    overlayStrong: 'rgba(6, 4, 12, 0.72)',

    white: '#FFFFFF',
    black: '#000000',
    shadow: 'rgba(0, 0, 0, 0.5)',
    scrim: 'rgba(185, 164, 242, 0.10)',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
