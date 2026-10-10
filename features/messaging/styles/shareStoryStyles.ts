import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const shareStoryStyles = StyleSheet.create({
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  recipientBody: { flex: 1 },
  recipientName: { fontWeight: '600' },
  sendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  sendLabel: {},
  body: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.md, borderWidth: 1 },
  linkIcon: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
});
