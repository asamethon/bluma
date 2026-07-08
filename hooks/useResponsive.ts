import { useWindowDimensions } from 'react-native';
import { Breakpoints, ContentMaxWidth, Spacing } from '@/constants/theme';

export type SizeClass = 'compact' | 'medium' | 'expanded';

/**
 * Reactive size-class helper — built on useWindowDimensions (not the static
 * Dimensions.get) so it stays correct across rotation and iPad Split View /
 * Slide Over resizes.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const sizeClass: SizeClass =
    width >= Breakpoints.expanded ? 'expanded' :
    width >= Breakpoints.medium ? 'medium' : 'compact';
  const numColumns = sizeClass === 'expanded' ? 3 : sizeClass === 'medium' ? 2 : 1;

  return {
    width,
    height,
    sizeClass,
    isTablet: sizeClass !== 'compact',
    isLandscape: width > height,
    numColumns,
  };
}

/**
 * Column-width helper for grid FlatLists. Note: `numColumns` cannot change on
 * a FlatList without a full remount — callers must set `key={`grid-${numColumns}`}`.
 */
export function useResponsiveGrid(gutter: number = Spacing.gutter) {
  const { width, numColumns } = useResponsive();
  const cappedWidth = Math.min(width, ContentMaxWidth.grid);
  const columnWidth = (cappedWidth - Spacing.screenX * 2 - gutter * (numColumns - 1)) / numColumns;
  return { numColumns, columnWidth };
}
