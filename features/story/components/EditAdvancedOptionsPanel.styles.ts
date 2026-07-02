import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) =>
  StyleSheet.create({
    advancedOptionsContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    advancedSection: {
      marginBottom: 24,
    },
    advancedSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    tagInputContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    tagAdvancedInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagAddButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagAddButtonDisabled: {
      opacity: 0.5,
    },
    tagsDisplay: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 4,
    },
    tagChipText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    tagRemoveButton: {
      padding: 2,
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
    completionAdvancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    completionAdvancedContent: {
      flex: 1,
    },
    completionAdvancedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    completionAdvancedTitleActive: {
      color: colors.success,
    },
    completionAdvancedSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
