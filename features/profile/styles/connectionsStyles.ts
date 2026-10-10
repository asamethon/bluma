import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const connectionsStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 52,
  },
  identity: { flex: 1 },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingHorizontal: Spacing.screenX,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    paddingBottom: 14, position: 'relative',
  },
  tabUnderline: {
    position: 'absolute', bottom: -1, left: 0, right: 0,
    height: 2, borderRadius: 1,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.screenX, marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md, height: 44, borderRadius: Radius.lg, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, lineHeight: 20, paddingVertical: 0 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  userIdentity: { flex: 1, minWidth: 0 },

  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  locked: { paddingTop: 32 },
  listContent: { paddingHorizontal: Spacing.screenX, paddingBottom: 120 },
  loading: { marginTop: Spacing.xxl, gap: Spacing.xl },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  loadingCopy: { flex: 1, gap: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { marginTop: 12, textAlign: 'center' },
});
