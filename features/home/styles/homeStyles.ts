import { Radius, Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Ana akış — editoryal künye (masthead) ritmi: başlık kutuya girmez, sayfanın
 * kendisi başlar. Bölümler arası ayrım boşluk ve hairline ile kurulur.
 */
export const createHomeStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gridContent: { paddingBottom: 140, paddingHorizontal: Spacing.screenX },
    listContent: { paddingBottom: 140 },
    gridStory: { paddingHorizontal: Spacing.gutter / 2, marginBottom: Spacing.lg },
    listStory: { paddingHorizontal: Spacing.screenX, marginBottom: Spacing.lg },
    loadMore: { paddingHorizontal: Spacing.screenX, paddingVertical: Spacing.lg, gap: Spacing.md },

    // — Künye —
    masthead: { paddingHorizontal: Spacing.screenX },
    mastheadTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 44 },
    brandMark: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto' },
    greetingBlock: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
    rail: {
      paddingHorizontal: Spacing.screenX,
      gap: Spacing.sm,
    },

    section: { marginTop: Spacing.xxl },
    writerNudge: { marginTop: Spacing.xxl, paddingHorizontal: Spacing.screenX },
    continueList: { paddingHorizontal: Spacing.screenX },
    storyList: { paddingHorizontal: Spacing.screenX },
    listRow: { paddingVertical: Spacing.md },
    shelf: {
      paddingHorizontal: Spacing.screenX,
      gap: Spacing.lg,
    },

    offlineNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginHorizontal: Spacing.screenX,
      marginTop: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: Radius.md,
      borderLeftWidth: 2,
    },
    offlineCopy: { flex: 1, minWidth: 0 },

    empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: Spacing.huge },
    emptyTitle: { marginTop: Spacing.xl },
    emptySubtitle: { marginTop: Spacing.sm },
  });
