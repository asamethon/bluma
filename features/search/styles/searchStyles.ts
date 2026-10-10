import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const searchStyles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  searchBar: { marginHorizontal: Spacing.screenX, marginBottom: Spacing.section },
  section: {
    paddingHorizontal: Spacing.screenX,
    marginBottom: Spacing.section,
    gap: Spacing.md,
  },
  sectionSpacing: { marginBottom: Spacing.xl },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenX,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    marginBottom: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentThumb: {
    width: 38,
    height: 52,
    borderRadius: Radius.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.screenX,
  },
  userIdentity: { flex: 1, minWidth: 0 },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: { marginTop: 12, textAlign: 'center' },
});
