import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Dikey akışlarda kullanılan yatay hikâye kartı. */
export const storyRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'stretch',
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  cover: {
    width: 82,
    height: 120,
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0, minHeight: 120 },
  eyebrowRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  titleBlock: { gap: Spacing.xxs },
  title: { flex: 1 },
  menuBtn: { marginTop: -6, marginRight: -5 },
  bodySpacer: { flex: 1, minHeight: Spacing.xs },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  status: { marginLeft: 'auto', flexShrink: 1 },
});
