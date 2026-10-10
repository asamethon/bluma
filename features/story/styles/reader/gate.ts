import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Misafir okuyucuya gösterilen kayıt kapısı — düz, ölçülü bir blok. */
export const readerGateStyles = StyleSheet.create({
  gateCard: {
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  gateFade: { height: 80, marginTop: -80, overflow: 'hidden' },
  gateFadeStep: { position: 'absolute', left: 0, right: 0 },
  gateKicker: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    height: 22,
    borderRadius: Radius.xs,
  },
  gateLogo: { marginTop: Spacing.lg, marginBottom: Spacing.md },
  gateTitle: { marginBottom: Spacing.sm },
  gateSub: { marginBottom: Spacing.xl },
  gateChips: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  gateChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  gateLoginRow: { flexDirection: 'row', marginTop: Spacing.md, alignItems: 'center', justifyContent: 'center' },
});
