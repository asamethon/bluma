import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Misafir boş durumu — ortalanmış kutu yığını yerine sola hizalı editoryal blok. */
export const guestStateStyles = StyleSheet.create({
  scroll: { flex: 1 },
  wrap: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.xl,
    paddingBottom: 120,
  },
  mark: { marginBottom: Spacing.xl },
  title: { marginBottom: Spacing.sm },
  sub: { marginBottom: Spacing.section, maxWidth: 340 },
  rows: { marginBottom: Spacing.section },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    flexShrink: 0,
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: Spacing.lg },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
