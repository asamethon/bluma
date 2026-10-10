import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const readingListStyles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontWeight: '700' },
  createRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screenX, paddingTop: Spacing.md },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    lineHeight: 20,
  },
  createBtn: { width: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.screenX, paddingBottom: 120 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  listIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listBody: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { marginTop: Spacing.md, fontWeight: '700' },
  emptyText: { marginTop: 6, textAlign: 'center' },
});
