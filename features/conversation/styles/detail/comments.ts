import { Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Yorum satırı — hairline ayraçlı editoryal liste öğesi. */
export const createConversationCommentStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    commentItem: {
      paddingHorizontal: Spacing.screenX,
      paddingVertical: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentInfo: { flex: 1, minWidth: 0 },
    commentContent: { marginBottom: Spacing.sm },
    commentImage: {
      width: '100%',
      minHeight: 150,
      maxHeight: 400,
      borderRadius: Radius.md,
      marginTop: Spacing.sm,
      backgroundColor: colors.surfaceVariant,
    },
  });
