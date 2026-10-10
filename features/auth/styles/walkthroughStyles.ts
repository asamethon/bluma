import { Fonts, Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Karşılama ekranı. Editoryal dilde ışık halesi/gradyan yok: koyu mor bir
 * zemin, ince bir marka kuralı ve serif künye. Renkler temadan bağımsız sabit.
 */
export const walkthroughStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  accentRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#DE5B88' },
  watermark: { position: 'absolute', right: -34, bottom: 220, opacity: 0.06 },
  // Ortak Screen tema zeminini boyar; welcome arka planını görünür bırak.
  screen: { flex: 1, backgroundColor: 'transparent' },

  welcome: { flex: 1, backgroundColor: '#241C42', overflow: 'hidden' },
  wHero: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  wWordmark: {
    fontFamily: Fonts.serif,
    fontSize: 52,
    color: '#fff',
    letterSpacing: -1.4,
    marginTop: Spacing.xxl,
    lineHeight: 68,
  },
  wTagline: {
    fontFamily: Fonts.serifItalic,
    fontSize: 19,
    lineHeight: 27,
    color: 'rgba(255,255,255,0.82)',
    marginTop: Spacing.xs,
  },
  wRule: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.32)',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  wBody: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.7)',
    maxWidth: 300,
  },

  wActions: {
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  wBtnPrimary: {
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: '#DE5B88',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  wBtnPrimaryText: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
    color: '#fff',
  },
  wBtnSecondary: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wBtnSecondaryText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
  },
  wBtnGuest: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  wBtnGuestText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14.5,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.78)',
  },
  wTerms: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  wTermsLink: {
    textDecorationLine: 'underline',
    color: 'rgba(255,255,255,0.72)',
  },
});
