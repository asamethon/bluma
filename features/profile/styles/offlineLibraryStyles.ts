import { Radius, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const createOfflineLibraryStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      fontSize: 20, lineHeight: 26,
      fontWeight: '600',
      color: colors.text,
    },
    storageInfo: {
      margin: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    storageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    storageTitle: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
    },
    storageStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18, lineHeight: 23,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12, lineHeight: 16,
      color: colors.textSecondary,
    },
    storageBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 8,
    },
    storageBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    storagePercent: {
      fontSize: 12, lineHeight: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    storyCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coverImage: {
      width: 60,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
    },
    storyInfo: {
      flex: 1,
    },
    storyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    storyTitle: {
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    authorName: {
      fontSize: 14, lineHeight: 18,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    storyMeta: {
      flexDirection: 'row',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 11, lineHeight: 14,
      color: colors.textSecondary,
    },
    emptyState: {
      paddingVertical: 80,
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyStateTitle: {
      fontSize: 20, lineHeight: 26,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    exploreButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: Radius.md,
    },
    exploreButtonText: {
      color: colors.surface,
      fontSize: 15, lineHeight: 20,
      fontWeight: '600',
    },
  });

export type OfflineLibraryStyles = ReturnType<typeof createOfflineLibraryStyles>;
