import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Editoryal bildirim listesi: her bildirim bir kart değil, hairline ayraçla
 * ayrılan bir satır. Okunmamışlık, solda ince bir aksan kuralıyla belli edilir.
 */
export const notificationStyles = StyleSheet.create({
  container: { flex: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenX,
    paddingVertical: Spacing.lg,
  },
  unreadRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  iconWrap: { position: 'relative' },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  textBlock: { flex: 1, minWidth: 0, gap: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  unreadDot: { width: 5, height: 5, borderRadius: 3 },
  // 30pt buton, 23pt başlık satırının optik ortasına çekilir.
  deleteBtn: { marginTop: -4, marginRight: -8 },

  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenX,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listContent: { flexGrow: 1, paddingBottom: 120 },
  guest: { flex: 1, justifyContent: 'center' },
  guestLogin: { marginTop: Spacing.lg, alignSelf: 'center' },
});
