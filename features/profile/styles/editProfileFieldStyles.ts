import { Fonts, Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const editProfileFieldStyles = StyleSheet.create({
  field: { padding: Spacing.lg },
  labelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 48,
  },
  input: {
    flex: 1, fontFamily: Fonts.sansRegular, fontSize: 15, lineHeight: 20, paddingVertical: 0,
  },
  bioInput: {
    borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, minHeight: 92,
    fontFamily: Fonts.serifRegular, fontSize: 16, lineHeight: 24,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.lg },
  icon: { marginRight: 8 },
  atSign: { marginRight: 2 },
  hint: { marginTop: 6 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontWeight: '600' },
});
