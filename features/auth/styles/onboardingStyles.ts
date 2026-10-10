import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const onboardingStyles = StyleSheet.create({
  progressHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
  },
  backCircle: {
    width: 38, height: 38, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -10,
  },
  progressTrack: {
    flex: 1, height: 3, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 2,
  },
  stepCounter: {
    minWidth: 32, textAlign: 'right',
  },
  intentList: { gap: 12, marginTop: 22 },
  intentCopy: { flex: 1 },
  intentSubtitle: { marginTop: 2, lineHeight: 18 },

  intentCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    padding: Spacing.lg, borderRadius: Radius.md,
  },
  intentIcon: {
    width: 44, height: 44, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  intentCheck: {
    width: 22, height: 22, borderRadius: Radius.xs,
    alignItems: 'center', justifyContent: 'center',
  },

  genreGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  genresStep: { marginTop: 22 },
  genreCount: { marginBottom: 16 },
  genreLabel: { fontWeight: '700', marginTop: 8 },
  genreCard: {
    width: '47%', borderRadius: Radius.md, borderWidth: 1,
    padding: Spacing.lg, minHeight: 92, overflow: 'hidden',
    position: 'relative',
  },
  genreIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  genreCheck: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    width: 20, height: 20, borderRadius: Radius.xs,
    alignItems: 'center', justifyContent: 'center',
  },

  avatarWrap: {
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 96, height: 96, borderRadius: Radius.xxl,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: {
    fontSize: 36, lineHeight: 47, fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute', right: -4, bottom: -4,
    width: 32, height: 32, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 1,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  atPrefix: { fontSize: 18, lineHeight: 23, fontWeight: '600', marginRight: 4 },
  textInput: { flex: 1, fontSize: 18, lineHeight: 23, fontWeight: '500' },
  usernameStatus: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 10,
  },
  profileStep: { marginTop: 22, gap: 16 },
  usernameHint: { textAlign: 'center', marginTop: 8 },

  completionWrap: {
    alignItems: 'center', paddingTop: 40,
  },
  completionHeading: { marginTop: Spacing.xxl, textAlign: 'center' },
  completionSubtitle: { textAlign: 'center', maxWidth: 290, lineHeight: 24, marginTop: 8 },
  genrePills: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 8, marginTop: 20, maxWidth: 300,
  },
  genrePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 30, paddingHorizontal: Spacing.md, borderRadius: Radius.sm,
    borderWidth: 1,
  },

  footer: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.md, paddingBottom: Spacing.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  screen: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: Spacing.screenX },
  scrollContent: { paddingBottom: 24 },
  stepIntro: { marginTop: 22, marginBottom: 4 },
  stepSubtitle: { marginTop: 6, lineHeight: 22 },
});
