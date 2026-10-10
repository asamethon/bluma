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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  composerBody: { flex: 1, paddingHorizontal: 20 },
  composerImageWrap: { position: 'relative', marginBottom: 16 },
  composerImage: { width: '100%', height: 180, borderRadius: Radius.lg },
  removeImage: { position: 'absolute', top: 8, right: 8 },
  notifyCopy: { flex: 1 },
  notifyTitle: { fontWeight: '600' },
  shareBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    minWidth: 70,
    alignItems: 'center',
  },
  msgInput: {
    fontSize: 16,
    lineHeight: 21,
    paddingVertical: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 16,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.md,
    marginBottom: 40,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
});
