import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Kayıt — giriş ekranıyla aynı editoryal ritim. */
export const signUpStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: Spacing.xl,
  },
  backBtn: { marginTop: Spacing.sm, marginLeft: -10 },
  hero: { marginTop: Spacing.xxl, marginBottom: Spacing.section },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  subtitle: { marginTop: 6 },
  form: { gap: Spacing.lg },
  submit: { marginTop: Spacing.xs },
  spacer: { flex: 1 },
  footer: {
    paddingVertical: Spacing.xxl,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
});
