import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Giriş — çerçevesiz form: alanlar sayfada akar, kart kutusu yok. */
export const signInStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: Spacing.xl,
  },
  backBtn: { marginTop: Spacing.sm, marginLeft: -10 },
  hero: { marginTop: Spacing.xxl, marginBottom: Spacing.section },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  form: { gap: Spacing.lg },
  forgotRow: { alignSelf: 'flex-end', marginTop: Spacing.sm },
  footer: {
    paddingVertical: Spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
