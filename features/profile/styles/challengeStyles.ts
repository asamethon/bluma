import { Fonts, Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Meydan okuma ekranı — editoryal ritim: renkli blob'lu kahraman blok yok.
 * Rütbe künyesi tipografiyle, ilerleme tek çizgilik bir şeritle anlatılır.
 */
export const challengeStyles = StyleSheet.create({
  screen: { flex: 1 },
  flexCopy: { flex: 1, minWidth: 0 },
  scrollContent: { paddingBottom: Spacing.huge },

  // — Rütbe künyesi —
  rankHero: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.xl },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rankIconWrap: {
    width: 48, height: 48, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  rankProgress: { marginTop: Spacing.lg, gap: Spacing.sm },
  xpRowLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  xpSmall: { fontFamily: Fonts.mono, fontSize: 12, lineHeight: 16 },
  xpBarBg: { height: 3, borderRadius: 2, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 2 },
  heroPills: { flexDirection: 'row', marginTop: Spacing.lg },
  heroPill: { flex: 1, gap: 2 },

  // — Haftalık öne çıkan —
  weeklyCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.screenX,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderLeftWidth: 2,
  },
  weeklyIcon: {
    width: 38, height: 38, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  weeklyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weeklyProgress: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },

  // — Filtreler ve liste —
  filters: { marginBottom: Spacing.md },
  filterRow: { paddingHorizontal: Spacing.screenX, gap: Spacing.sm, paddingBottom: Spacing.xs },
  challengeList: { paddingHorizontal: Spacing.screenX },
  heroRule: { marginTop: Spacing.xl, marginBottom: Spacing.xl, marginHorizontal: Spacing.screenX },

  // — Tek meydan okuma —
  challengeRow: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.lg },
  challengeIconWrap: {
    width: 40, height: 40, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  challengeTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
  challengeProgressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  progressBg: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontFamily: Fonts.mono, fontSize: 12, lineHeight: 16 },
  xpValue: { fontFamily: Fonts.mono, fontSize: 12, lineHeight: 16 },
});
