import { Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Tek yorum satırı ve yanıt ağacı. */
export const createCommentItemStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    commentItem: {
      paddingVertical: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    userAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentInfo: {
      flex: 1,
    },
    userNameContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    userName: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "600",
      color: colors.text,
    },
    verifiedBadge: {
      width: 14,
      height: 14,
    },
    userHandle: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.primary,
    },
    commentTime: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
    },
    commentContent: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    commentActions: {
      flexDirection: "row",
      gap: 20,
    },
    commentAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    repliesContainer: {
      marginTop: 8,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
      paddingLeft: 12,
    },
  });
