import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) =>
  StyleSheet.create({
    quickWriteContainer: {
      flex: 1,
      paddingTop: 20,
    },
    titleInput: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      paddingTop: 18,
      paddingBottom: 18,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      minHeight: 56,
    },
    contentInput: {
      fontSize: 16,
      color: colors.text,
      paddingTop: 22,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      textAlignVertical: 'top',
      lineHeight: 24,
    },
  });
