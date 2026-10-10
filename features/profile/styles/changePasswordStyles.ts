import { Fonts, Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const createChangePasswordStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    headerSpacer: { width: 40 },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenX, paddingBottom: 60 },
    iconHero: {
      width: 60,
      height: 60,
      borderRadius: Radius.md,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    showRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
    providerCard: { padding: Spacing.lg },
    providerTitle: { marginBottom: 6 },
    providerMessage: { marginBottom: Spacing.lg },
    description: { marginBottom: Spacing.lg, textAlign: 'center' },
    field: { padding: Spacing.lg },
    fieldLabel: { marginBottom: 8 },
    fieldBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceVariant,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.md,
      height: 48,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontFamily: Fonts.sansRegular,
      fontSize: 15,
      lineHeight: 20,
      paddingVertical: 0,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: Spacing.lg },
    saveButton: { marginTop: Spacing.lg },
    forgot: { marginTop: Spacing.xl, alignItems: 'center' },
  });

export type ChangePasswordStyles = ReturnType<typeof createChangePasswordStyles>;
