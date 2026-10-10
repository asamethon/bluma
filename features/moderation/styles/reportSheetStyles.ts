import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const reportSheetStyles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.md },
  title: { fontSize: 19, lineHeight: 25, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 13, lineHeight: 17, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  reasonText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  details: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 12,
    minHeight: 70,
    fontSize: 14, lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  submit: { height: 50, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  submitText: { color: '#fff', fontSize: 16, lineHeight: 21, fontWeight: '700' },
  cancel: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
});
