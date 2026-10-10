import { Radius, Spacing, Typography, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const H_GAP = 14;
/** Konum şeridinin kapağın altında kapladığı yer — kapak ölçüsünden düşülür.
 *  Dar tutulur: kapak ile künye arasındaki her puan kapağa gider. */
export const INDICATOR_BLOCK = Spacing.sm + Spacing.md;

/** Künye BLOĞUNUN yüksekliği tipografiden türetilir ve sabittir: iki satırlık
 *  başlık ile üç satırlık açıklama her hikâyede paylarını alır. İçerik bloğun
 *  üstüne yaslanır, artan pay açıklama ile buton arasında boşluk olarak durur —
 *  böylece kapak kaydırılırken aksiyon da künye de yerinden oynamaz. */
const TITLE_BLOCK = Typography.overline.lineHeight + Spacing.xs + Typography.title.lineHeight * 2;
const BYLINE = 24 + Spacing.sm * 2;
const DESCRIPTION = Spacing.md + Typography.bodyLg.lineHeight * 3;
const BODY_HEIGHT = Spacing.md + TITLE_BLOCK + BYLINE + Typography.caption.lineHeight + DESCRIPTION;

/**
 * Hikâye önizleme — kitapçı rafı: kapak başrolde, künye altında tipografik
 * bir blok olarak akar. Ayraç çizgisi YOK; ritmi yalnızca boşluk ve
 * tipografi kurar. Sayfa kaymaz: kapak, artan alanı doldurur.
 */
export const createStoryPreviewStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    /** Kapağa kalan alan — ölçüsü ölçülür, tahmin edilmez. */
    stage: { flex: 1, justifyContent: 'center' },
    carousel: { alignItems: 'center', gap: H_GAP },
    cardPress: { flex: 1 },
    cover: { flex: 1 },

    indicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
      height: Spacing.md,
      marginTop: Spacing.sm,
    },
    dot: { height: 4, borderRadius: Radius.xs },

    body: { height: BODY_HEIGHT, paddingHorizontal: Spacing.screenX, paddingTop: Spacing.md },
    titleBlock: { gap: Spacing.xs },
    byline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      alignSelf: 'flex-start',
      paddingVertical: Spacing.sm,
    },
    desc: { marginTop: Spacing.md },

    cta: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.md, paddingBottom: Spacing.md },

    status: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.lg,
      paddingHorizontal: Spacing.screenX,
    },
    skeleton: { flex: 1, alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.md },
    skeletonCard: { width: '46%', aspectRatio: 2 / 3, height: undefined, marginBottom: Spacing.xl },
  });
