import { Fonts } from '@/constants/theme';
import { StyleSheet } from 'react-native';

// Tuval 360pt'lik bir tasarıma göre çizilir; ölçek çarpanı sayesinde önizleme
// genişliği ne olursa olsun oranlar (ve dolayısıyla dışa aktarılan görsel) aynı kalır.
export const ARTWORK_BASE_WIDTH = 360;

// Paylaşılan görsel bu genişlikte çizilir: 2x ekranda tam 1080px, 3x ekranda
// 1620px üretir; ikisi de hedef çözünürlüğü büyütmeden karşılar.
export const ARTWORK_EXPORT_WIDTH = 540;

// Story 9:19.5 üretilir: modern telefon ekranını tam doldurur, 16:9 ekranlarda
// kırpılan pay güvenli boşluğun içinde kalır. Üst/alt boşluk Instagram'ın kendi
// arayüz şeritlerinin içeriği kapatmaması için ayrılmıştır.
export function createArtworkStyles(scale: number, compact: boolean) {
  const px = (value: number) => value * scale;

  return StyleSheet.create({
    canvas: {
      width: '100%',
      aspectRatio: compact ? 4 / 5 : 1080 / 2340,
      backgroundColor: '#F8F3FF',
      paddingHorizontal: px(compact ? 22 : 24),
      paddingTop: px(compact ? 22 : 78),
      paddingBottom: px(compact ? 22 : 124),
      overflow: 'hidden',
    },
    orb: { position: 'absolute', borderRadius: px(999) },
    orbTop: { width: px(240), height: px(240), top: px(-118), right: px(-92) },
    orbBottom: {
      width: px(150), height: px(150), bottom: px(64), left: px(-82),
      borderWidth: px(28), backgroundColor: 'transparent',
    },

    brandRow: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
    mark: {
      width: px(30), height: px(30), borderRadius: px(10), backgroundColor: '#FAF6EF',
      overflow: 'hidden',
    },
    // İkonun kendi iç boşluğunu kırpıp çiçeği rozetin içinde büyütür.
    markImage: { transform: [{ scale: 1.45 }] },
    brand: { marginLeft: px(8), color: '#2A1B52', fontFamily: Fonts.sansBold, fontSize: px(18), letterSpacing: px(-.4) },
    launchPill: {
      marginLeft: 'auto', borderWidth: px(1), borderColor: '#2A1B5230', borderRadius: px(999),
      paddingHorizontal: px(10), paddingVertical: px(5),
    },
    launchLabel: { color: '#2A1B52', fontFamily: Fonts.sansBold, fontSize: px(8), letterSpacing: px(1.2) },

    hero: {
      alignSelf: 'center', width: compact ? '36%' : '54%', aspectRatio: 2 / 3,
      marginTop: px(compact ? 14 : 22), position: 'relative',
    },
    coverDepth: { position: 'absolute', top: px(8), left: px(8), right: px(-8), bottom: px(-8), borderRadius: px(15), opacity: .42 },
    cover: { flex: 1, borderRadius: px(compact ? 12 : 15), overflow: 'hidden', backgroundColor: '#E8E0F4' },
    coverFallback: { alignItems: 'center', justifyContent: 'center' },
    coverShade: { position: 'absolute', inset: 0, backgroundColor: '#120B2422' },
    genreChip: {
      position: 'absolute', left: px(12), bottom: px(12), backgroundColor: '#FFFFFFE8',
      paddingHorizontal: px(9), paddingVertical: px(5), borderRadius: px(999),
    },
    genre: { color: '#2A1B52', fontFamily: Fonts.sansBold, fontSize: px(8), letterSpacing: px(.4), textTransform: 'uppercase' },

    copy: { alignItems: 'center', marginTop: px(compact ? 16 : 26), paddingHorizontal: px(4) },
    eyebrow: { fontFamily: Fonts.sansBold, fontSize: px(10), letterSpacing: px(2), textTransform: 'uppercase' },
    title: {
      marginTop: px(8), color: '#211D2C', fontFamily: Fonts.serif, textAlign: 'center',
      fontSize: px(compact ? 25 : 29), lineHeight: px(compact ? 30 : 35), letterSpacing: px(-.7),
    },
    author: { marginTop: px(8), color: '#686171', fontFamily: Fonts.sansSemiBold, fontSize: px(12) },
    description: {
      marginTop: px(14), color: '#686171', fontFamily: Fonts.serifRegular,
      fontSize: px(12), lineHeight: px(18), textAlign: 'center',
    },

    footer: { marginTop: 'auto', alignItems: 'center' },
    cta: {
      flexDirection: 'row', alignItems: 'center', gap: px(7), backgroundColor: '#2A1B52',
      borderRadius: px(999), paddingHorizontal: px(18), paddingVertical: px(10),
    },
    ctaText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: px(11) },
  });
}
