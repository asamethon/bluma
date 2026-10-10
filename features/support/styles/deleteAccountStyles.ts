import { Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Hesap silme akışı — geri alınamaz aksiyon; uyarı tonu ölçülü ama net. */
export const createDeleteAccountStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: Spacing.screenX, paddingTop: Spacing.xl },
    warning: {
      flexDirection: 'row',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.warning + '55',
      backgroundColor: colors.warning + '12',
      marginBottom: Spacing.xxl,
    },
    warningCopy: { flex: 1, minWidth: 0, gap: Spacing.xs },
    field: { marginBottom: Spacing.xxl },
  });
