import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Kütüphane — künye üstte, bölümler hairline ayraçlı satır listeleri. */
export const libraryStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  rowWrap: { paddingHorizontal: Spacing.screenX, paddingVertical: Spacing.md },
  listsRow: { marginHorizontal: Spacing.screenX, marginBottom: Spacing.lg },
  listContent: { paddingBottom: 140 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: Spacing.huge },
});
