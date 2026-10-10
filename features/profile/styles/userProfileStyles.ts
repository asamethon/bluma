import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const userProfileStyles = StyleSheet.create({
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  menuCard: {
    position: 'absolute',
    top: 74,
    right: Spacing.screenX,
    minWidth: 208,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
