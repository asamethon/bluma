import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Bluma hikâye kartı geometrileri: fiziksel kitap kapağı + okuma kimliği. */
export const storyCardStyles = StyleSheet.create({
  // — Portre raf kartı —
  bookFrame: {
    width: '100%',
    position: 'relative',
  },
  bookDepth: {
    position: 'absolute',
    top: 4, left: 4, right: 0, bottom: 0,
    borderRadius: Radius.md,
  },
  portraitCover: { position: 'absolute', top: 0, left: 0, right: 4, bottom: 4 },
  caption: { marginTop: Spacing.sm, gap: Spacing.xxs },
  captionTitle: { minHeight: 46 },

  // — Öne çıkan kart (feature) —
  featureWrap: { paddingHorizontal: Spacing.screenX },
  featureMedia: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  featureBody: { marginTop: Spacing.md, gap: Spacing.xs },
  featureMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  featureStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginLeft: 'auto' },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
