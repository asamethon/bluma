import { Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Yardım ekranı: gruplar SettingsGroup'tan gelir; burada yalnızca SSS ritmi. */
export const createHelpStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: Spacing.huge },
    faqItem: { paddingVertical: Spacing.md },
    faqButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      width: '100%',
    },
    faqQuestion: { flex: 1, minWidth: 0 },
    faqAnswer: {
      marginTop: Spacing.sm,
      paddingLeft: Spacing.md,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
      borderRadius: Radius.xs,
    },
  });
