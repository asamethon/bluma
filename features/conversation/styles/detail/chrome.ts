import type { Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Başlık, yükleniyor ve boş durum. */
export const createConversationChromeStyles = (colors: Theme['colors']) =>
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18, lineHeight: 23,
      fontWeight: '600',
      color: colors.text,
    },
    headerButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16, lineHeight: 21,
      color: colors.textSecondary,
    },
    listContainer: {
      paddingBottom: 20,
    },
    emptyCommentsContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyCommentsText: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    emptyCommentsSubtext: {
      fontSize: 14, lineHeight: 18,
      color: colors.textSecondary,
    },
  });
