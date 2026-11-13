import { Fonts } from '@/constants/theme';
import { StyleSheet } from 'react-native';

// Lansman kartıyla aynı yaklaşım: 360pt tasarım, ölçek çarpanıyla çizilir;
// önizleme ve dışa aktarım (1080×2340) aynı oranları paylaşır.
export const MILESTONE_BASE_WIDTH = 360;
export const MILESTONE_EXPORT_WIDTH = 540;

const INK = '#2A1B52';
const MUTED = '#686171';

export function createMilestoneArtworkStyles(scale: number) {
  const px = (value: number) => value * scale;
  return StyleSheet.create({
    canvas: {
      width: '100%', aspectRatio: 1080 / 2340, backgroundColor: '#F8F3FF',
      paddingHorizontal: px(26), paddingTop: px(78), paddingBottom: px(118), overflow: 'hidden',
    },
    orb: { position: 'absolute', borderRadius: px(999) },
    orbTop: { width: px(260), height: px(260), top: px(-130), right: px(-96), backgroundColor: '#DE5B8833' },
    orbBottom: {
      width: px(170), height: px(170), bottom: px(-60), left: px(-90),
      borderWidth: px(30), borderColor: '#7057D955',
    },

    brandRow: { flexDirection: 'row', alignItems: 'center' },
    mark: { width: px(30), height: px(30), borderRadius: px(10), backgroundColor: '#FAF6EF', overflow: 'hidden' },
    markImage: { transform: [{ scale: 1.45 }] },
    brand: { marginLeft: px(8), color: INK, fontFamily: Fonts.sansBold, fontSize: px(18), letterSpacing: px(-0.4) },
    pill: {
      marginLeft: 'auto', borderWidth: px(1), borderColor: '#2A1B5230', borderRadius: px(999),
      paddingHorizontal: px(10), paddingVertical: px(5),
    },
    pillLabel: { color: INK, fontFamily: Fonts.sansBold, fontSize: px(8), letterSpacing: px(1.2) },

    hero: { alignItems: 'center', marginTop: px(40) },
    // Büyük harf metinde üretilir (toLocaleUpperCase): RN'nin textTransform'u
    // dile duyarsız, Türkçede "BIRLIKTE" / "HIKÂYE" basıyordu.
    eyebrow: { color: '#7057D9', fontFamily: Fonts.sansBold, fontSize: px(10), letterSpacing: px(2.4) },
    number: {
      marginTop: px(6), color: INK, fontFamily: Fonts.serif,
      fontSize: px(96), lineHeight: px(118), letterSpacing: px(-3),
    },
    headline: { color: INK, fontFamily: Fonts.serif, fontSize: px(26), lineHeight: px(34), letterSpacing: px(-0.6) },

    member: {
      marginTop: px(34), alignItems: 'center', backgroundColor: '#FFFFFF',
      borderRadius: px(18), paddingVertical: px(20), paddingHorizontal: px(18),
    },
    memberNumber: { color: '#DE5B88', fontFamily: Fonts.serif, fontSize: px(46), lineHeight: px(58), letterSpacing: px(-1.4) },
    memberLine: { marginTop: px(2), color: INK, fontFamily: Fonts.sansSemiBold, fontSize: px(13), textAlign: 'center' },
    founder: {
      marginTop: px(12), flexDirection: 'row', alignItems: 'center', gap: px(5),
      backgroundColor: '#E7B85C2E', borderRadius: px(6), paddingHorizontal: px(9), paddingVertical: px(5),
    },
    founderLabel: { color: '#8A6413', fontFamily: Fonts.sansBold, fontSize: px(9), letterSpacing: px(1.4) },
    joined: { marginTop: px(10), color: MUTED, fontFamily: Fonts.sansMedium, fontSize: px(10.5) },

    stats: { marginTop: px(26), flexDirection: 'row', justifyContent: 'space-between' },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { color: INK, fontFamily: Fonts.serif, fontSize: px(22), lineHeight: px(29), letterSpacing: px(-0.5) },
    statLabel: { marginTop: px(2), color: MUTED, fontFamily: Fonts.sansBold, fontSize: px(8.5), letterSpacing: px(1.2) },

    footer: { marginTop: 'auto', alignItems: 'center' },
    cta: { backgroundColor: INK, borderRadius: px(999), paddingHorizontal: px(18), paddingVertical: px(10) },
    ctaText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: px(11) },
  });
}
