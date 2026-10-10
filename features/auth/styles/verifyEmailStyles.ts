import type { Theme } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const createVerifyEmailStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    body: { padding: Spacing.lg, gap: Spacing.lg },
    card: {
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    center: { textAlign: 'center' },
  });
