import { Spacing } from '@/constants/theme';

/** Akışta sekme şeridinin üst boşluğu. */
export const TABS_PAD_FLOW = Spacing.xxl;
/** Yapışkan şeritte aynı boşluk daralır — bar iki satırdan fazla büyümesin. */
export const TABS_PAD_PINNED = Spacing.xs;
/** Yapışkan şeritteki kimlik satırının yüksekliği. */
export const PINNED_ROW_HEIGHT = 52;

/**
 * Akıştaki sekme şeridi, yapışkan olanın tam altına geldiği kaydırma noktası.
 * İkisi aynı bileşen olduğu için bu eşikte devir teslim göze çarpmaz.
 */
export const pinnedThreshold = (headerHeight: number, topInset: number) =>
  headerHeight > 0
    ? headerHeight + TABS_PAD_FLOW - topInset - PINNED_ROW_HEIGHT - TABS_PAD_PINNED
    : Number.POSITIVE_INFINITY;
