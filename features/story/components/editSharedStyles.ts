import { StyleSheet } from 'react-native';

// EditQuickWriteForm / EditAdvancedWriteForm arasında tekrar eden kategori
// çipleri ve "gelişmiş seçenekler" toggle stilleri — tek yerde toplandı.
export const createSharedStyles = (colors: any) =>
  StyleSheet.create({
    inputMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    inputValidation: {
      fontSize: 12,
      fontWeight: '500',
    },
    validationSuccess: {
      color: colors.success,
    },
    validationError: {
      color: colors.error,
    },
    characterCount: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    contentStats: {
      flexDirection: 'row',
      gap: 16,
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    quickCategoryContainer: {
      marginBottom: 20,
    },
    quickCategoryLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    quickCategoryScroll: {
      marginHorizontal: -4,
    },
    quickCategoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 4,
    },
    quickCategoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    quickCategoryChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    quickCategoryChipTextActive: {
      color: colors.white,
    },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      marginBottom: 20,
    },
    advancedToggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
