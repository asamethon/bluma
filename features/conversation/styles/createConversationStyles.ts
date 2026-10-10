import { Radius, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const createConversationStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    headerTitle: {
      fontSize: 18, lineHeight: 23,
      fontWeight: '600',
      color: colors.text,
    },
    headerButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    headerButtonDisabled: {
      opacity: 0.5,
    },
    headerButtonText: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    scrollContent: { paddingBottom: 40 },
    inputContainer: {
      marginTop: 24,
    },
    inputLabel: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    titleInput: {
      fontSize: 20, lineHeight: 26,
      fontWeight: '600',
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: 16,
      minHeight: 60,
      backgroundColor: colors.surfaceVariant,
      textAlignVertical: 'top',
    },
    contentInput: {
      fontSize: 16, lineHeight: 21,
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: 16,
      minHeight: 200,
      backgroundColor: colors.surfaceVariant,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: 12, lineHeight: 16,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    tipsContainer: {
      marginTop: 32,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tipsTitle: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
      gap: 8,
    },
    tipText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    announceContainer: {
      marginTop: 24,
    },
    announceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    announceCheckbox: {
      marginRight: 12,
    },
    announceTextContainer: {
      flex: 1,
    },
    announceTitle: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    announceSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    imageSelectButton: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: Radius.md,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    imageSelectText: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '500',
      marginTop: 8,
    },
    imagePreviewContainer: {
      position: 'relative',
      marginTop: 8,
      borderRadius: Radius.md,
      overflow: 'hidden',
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
      padding: 4,
    },
  });

export type CreateConversationStyles = ReturnType<typeof createConversationStyles>;
