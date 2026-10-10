import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const followRequestsStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32 },
});
