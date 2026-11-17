import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
  heroActionsEnd: { justifyContent: 'flex-end' },
  coverAction: { backgroundColor: 'rgba(0,0,0,0.28)' },
  identity: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.md,
  },
  // Ad kendi satırında durur; rozet küçük meta satırına (@kullanıcı) iner ki
  // 28pt serif başlıkla 22pt rozet aynı hizada sıkışmasın.
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  bio: { marginTop: Spacing.md },
  // Aksiyonlar avatarın sağında, kapağın hemen altında: kimlik bir satır kazanır.
  aside: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  // Kutu da ayraç da yok: bant kendi boşluğuyla ayrılır.
  statsWrap: { marginTop: Spacing.xxl, paddingHorizontal: Spacing.screenX },
  statsBar: { flexDirection: 'row', alignItems: 'flex-start' },
  privateNotice: { marginTop: Spacing.xxl },
  // Üst boşluk akış/yapışkan varyantına göre bileşende verilir.
  tabsWrap: { paddingHorizontal: Spacing.screenX },
  // Her satır kendi üst boşluğunu taşır; ayrı bir ayraç bileşeni gerekmez.
  tabRow: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.md,
  },
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  composeHint: { flex: 1 },
});
