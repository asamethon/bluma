import { Layout, Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Kitap sayfası: künye, bölüm başlığı, okuma gövdesi ve bölüm sonu. */
export const readerBodyStyles = StyleSheet.create({
  body: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 96,
  },
  wideBody: { maxWidth: 680, alignSelf: 'center', width: '100%' },
  /** Alt çubuğun metni örtmemesi için son nefes boşluğu. */
  canvasFooter: { height: Spacing.huge },

  // — Künye (yalnızca ilk bölümde) —
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  adultTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.xs,
  },
  adultText: { fontSize: 11, lineHeight: 15, fontWeight: '700' },
  storyTitle: {
    fontSize: 33, lineHeight: 43, fontWeight: '700', letterSpacing: -0.6,
    marginTop: Spacing.lg, marginBottom: Spacing.lg,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  authorPress: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  authorIdentity: { flex: 1, minWidth: 0 },
  authorName: { fontWeight: '700' },
  mastheadRule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.xl },

  // — Bölüm başlığı —
  chapterHead: { paddingTop: Spacing.xxl, paddingBottom: Spacing.lg },
  chapterKicker: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chapterHeadTitle: {
    fontSize: 24, lineHeight: 33, fontWeight: '700', letterSpacing: -0.4,
    marginTop: Spacing.sm,
  },
  chapterHeadMeta: { marginTop: Spacing.sm },

  // — Gövde —
  storyBody: { marginTop: Spacing.xs },
  bodyText: { fontWeight: '400' },
  flexText: { flex: 1 },
  dropCapRow: { flexDirection: 'row', alignItems: 'flex-start', overflow: 'visible' },
  dropCap: {
    fontSize: 52, lineHeight: 68, fontWeight: '700',
    paddingLeft: 2, paddingRight: Spacing.md, marginTop: 2,
  },
  bodySkeleton: { gap: Spacing.md, marginTop: Spacing.sm },

  // — Bölüm sonu —
  endRule: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, marginTop: Spacing.section, marginBottom: Spacing.xl,
  },
  endRuleLine: { flex: 1, maxWidth: 64, height: StyleSheet.hairlineWidth },
  endRuleDot: { width: 5, height: 5, borderRadius: Radius.pill },
  chapterLikeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', gap: Spacing.sm,
    height: Layout.touch, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md, borderWidth: 1,
  },

  // — Bölüm gezinme kartları —
  chapterNav: { gap: Spacing.sm, marginTop: Spacing.section },
  chapterNavRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth,
    minHeight: 62,
  },
  chapterNavText: { flex: 1, minWidth: 0, gap: 2 },
  chapterNavEnd: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.section },
});
