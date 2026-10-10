import { Radius, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Başlık, bölüm filtresi, liste ve boş durum. */
export const createCommentsChromeStyles = (colors: Theme['colors']) =>
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      padding: 8,
      width: 40,
    },
    headerTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "600",
      color: colors.text,
    },
    chapterFilterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingBottom: 12,
      marginTop: 8,
    },
    chapterFilterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceVariant,
    },
    chapterFilterText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    activeFilterText: { color: '#fff' },
    commentsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    listContent: { paddingBottom: 140 },
    loadMoreButton: {
      alignSelf: "center",
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginTop: 8,
    },
    loadMoreText: {
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "600",
      color: colors.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyStateTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });
