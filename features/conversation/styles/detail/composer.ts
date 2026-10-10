import { Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Yorum yazma alanı ve görsel ön izlemesi. */
export const createConversationComposerStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    commentInputSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      backgroundColor: colors.background,
    },
    imagePreviewContainer: {
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.md,
      position: 'relative',
    },
    imagePreview: { width: 76, height: 76, borderRadius: Radius.sm },
    removeImageButton: {
      position: 'absolute',
      top: Spacing.sm,
      left: 76,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.screenX,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    imageButton: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceVariant,
    },
    commentInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: Radius.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      maxHeight: 110,
      textAlignVertical: 'top',
    },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.4 },
  });
