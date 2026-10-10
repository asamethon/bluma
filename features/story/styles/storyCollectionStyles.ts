import type { Theme } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Favoriler ve kaydedilenler gibi başlıklı hikâye listelerinin ortak stili. */
export const createStoryCollectionStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.screenX,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerSpacer: { width: 40 },
    headerTitle: { fontSize: 18, lineHeight: 23, fontWeight: '600', color: colors.text },
    listContent: { paddingTop: Spacing.md, paddingBottom: 120 },
    loadingContainer: { paddingVertical: 40, alignItems: 'center' },
    loadingText: { fontSize: 16, lineHeight: 21, color: colors.textSecondary },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontWeight: '600',
      color: colors.text,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    emptyMessage: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    emptyAction: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: Radius.md,
    },
    emptyActionText: { fontSize: 16, lineHeight: 21, fontWeight: '600', color: colors.white },
  });
