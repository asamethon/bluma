import { Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Hikâye künyesi — editoryal dizgi: kapak solda, başlık serif, bölümler
 * kart değil hairline ayraçlı satırlar.
 */
export const createStoryInfoStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerBar: { paddingHorizontal: Spacing.screenX, paddingBottom: Spacing.sm },
    listContent: { paddingBottom: 80 },
    status: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },

    hero: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.lg,
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    cover: {
      width: 100,
      height: 142,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceVariant,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    heroMeta: { flex: 1, minWidth: 0, gap: Spacing.xs },

    actionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.screenX,
      marginBottom: Spacing.xl,
    },
    primaryAction: { flex: 1 },

    description: { paddingHorizontal: Spacing.screenX, marginBottom: Spacing.section },

    chapterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      paddingVertical: Spacing.lg,
      marginHorizontal: Spacing.screenX,
    },
    chapterLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, minWidth: 0 },
    chapterIndex: { width: 24 },

    footerActions: {
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.xl,
      gap: Spacing.sm,
    },
  });

export type StoryInfoStyles = ReturnType<typeof createStoryInfoStyles>;
