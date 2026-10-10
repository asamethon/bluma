import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const addToListStyles = StyleSheet.create({
  listArea: { maxHeight: 320 },
  listBody: { flex: 1 },
  body: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.md },
  title: { fontSize: 19, lineHeight: 25, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 20, lineHeight: 20 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  listIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listName: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  listCount: { fontSize: 12, lineHeight: 16, marginTop: 1 },
  createRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, lineHeight: 20},
  createBtn: { width: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  newListBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: Radius.pill, borderWidth: 1, marginTop: 10,
  },
  newListText: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  done: { paddingVertical: 14, alignItems: 'center' },
  doneText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
});
