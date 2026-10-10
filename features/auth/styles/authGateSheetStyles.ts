import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const authGateSheetStyles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 8,
    alignItems: 'center',
  },
  logoWrap: { marginBottom: 14, marginTop: 8 },
  logoBox: {
    position: 'relative',
    width: 60, height: 60, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  reasonBadge: {
    position: 'absolute', right: -6, bottom: -6,
    width: 24, height: 24, borderRadius: Radius.xs,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  title: { textAlign: 'center', marginBottom: Spacing.sm },
  sub: { textAlign: 'center', marginBottom: Spacing.xl, maxWidth: 300 },
  benefits: {
    flexDirection: 'row', gap: 8, width: '100%',
    marginBottom: 22,
  },
  benefitBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs,
    borderRadius: Radius.sm,
  },
  benefitLabel: { textAlign: 'center' },
  loginRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
  },
  skipBtn: {
    paddingVertical: 10, marginTop: 4,
  },
});
