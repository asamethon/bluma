import { Radius, Spacing, Typography } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Pano yazıcısı — renk taşımayan düzen katmanı (renkler `useTheme`'den gelir).
 * Kutu ve gölge yok: ritmi boşluk, ayrımı hairline kurar (docs/DESIGN.md).
 */
export const composerStyles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  // Çerçevesiz, alt çizgisiz yazı alanı: metin avatarın yanında serbest akar.
  input: {
    flex: 1,
    minHeight: 120,
    paddingTop: 0,
    textAlignVertical: 'top',
    fontFamily: Typography.bodyLg.fontFamily,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
  },
  preview: {
    position: 'relative',
    marginHorizontal: Spacing.screenX,
    marginBottom: Spacing.xxl,
  },
  previewImage: { width: '100%', height: 200, borderRadius: Radius.lg },
  previewRemove: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  announce: { paddingHorizontal: Spacing.screenX },
  // Klavyenin hemen üstünde duran ince araç çubuğu.
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenX,
    paddingVertical: Spacing.sm,
  },
  counter: { marginLeft: 'auto' },
});
