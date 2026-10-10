import { Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Yorum yazma alanı ve yanıt rozeti. */
export const createCommentComposerStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    keyboardAvoidingView: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    commentInputContainer: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      paddingHorizontal: Spacing.screenX,
      paddingTop: 12,
      paddingBottom: 12,
    },
    replyingToContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.primaryLight + "30",
      borderRadius: Radius.xs,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    replyingToText: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.primary,
      fontWeight: "500",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 12,
    },
    inputAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    inputAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontSize: 14,
      lineHeight: 18,
      color: colors.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: {
      backgroundColor: colors.textLight,
    },
  });
