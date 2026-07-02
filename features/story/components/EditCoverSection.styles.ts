import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) =>
  StyleSheet.create({
    coverSection: {
      marginBottom: 20,
    },
    coverSectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    coverSelectButton: {
      alignSelf: 'center',
      borderRadius: 12,
      overflow: 'hidden',
    },
    coverThumbnail: {
      width: 80,
      height: 100,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    coverPlaceholder: {
      width: 80,
      height: 100,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    coverPlaceholderText: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Modern Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modernModalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modernModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    modernModalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    modalActions: {
      gap: 12,
      marginBottom: 20,
    },
    modernModalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    modalButtonIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonContent: {
      flex: 1,
    },
    modernModalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    modernModalButtonSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    modernModalCancelButton: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    modernModalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
