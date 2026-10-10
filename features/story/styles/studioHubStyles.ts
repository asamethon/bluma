import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Stüdyo — editoryal masa: kesikli kutu yerine hairline ayraçlı satır ritmi. */
export const studioHubStyles = StyleSheet.create({
  intro: { paddingTop: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.xs },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCopy: { flex: 1, minWidth: 0 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tick: { width: 20, height: 2, borderRadius: 1, marginBottom: Spacing.sm },
  storiesHead: {  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
});
