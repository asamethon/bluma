import { Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Sohbet gönderisi — editoryal açılış: kart kutusu yok, künye ve metin
 * doğrudan sayfada akar, altında hairline ile yorumlardan ayrılır.
 */
export const createConversationPostStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    conversationHeader: {
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xl,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    authorAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorDetails: { flex: 1, minWidth: 0 },
    conversationTitle: { marginBottom: Spacing.sm },
    conversationContent: { marginBottom: Spacing.lg },
    conversationStats: { flexDirection: 'row', gap: Spacing.xl },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    conversationImage: {
      width: '100%',
      minHeight: 200,
      maxHeight: 400,
      borderRadius: Radius.md,
      marginBottom: Spacing.lg,
      backgroundColor: colors.surfaceVariant,
    },
  });
