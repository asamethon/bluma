import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Üst/alt çubuklar, ilerleme şeridi ve ayar sayfası satırları.
 *
 * Çubuklar DÜZ ve OPAK zemindir: yarı saydam zemin + `backdropFilter` denendi,
 * iOS'ta metin çubuğun altından okunacak kadar sızıyordu. Cam taklidi yerine
 * hairline ayrım kullanılır (editoryal dilin zaten istediği şey).
 */
export const readerChromeStyles = StyleSheet.create({
  page: { flex: 1 },

  topChrome: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chromeTitle: { flex: 1, minWidth: 0, paddingHorizontal: Spacing.xs },
  chromeTitleText: { fontSize: 15 },
  chromeSubtitle: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  bottomChrome: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chromeStat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, minHeight: 36 },
  flexSpacer: { flex: 1 },

  /** Ekranın en alt kenarındaki okuma rayı — çubuklar gizliyken de durur. */
  progressRail: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30 },

  // — Ayarlar sayfası —
  settingsBlock: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.md, gap: Spacing.xl },
  settingsRow: { gap: Spacing.sm },
  settingsRowInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewBox: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  themeRow: { flexDirection: 'row', gap: Spacing.md },
  themeOption: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  themeSwatch: {
    width: '100%', height: 46,
    borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  themeSwatchLetter: { fontSize: 17, lineHeight: 23, fontWeight: '700' },

  // — İçindekiler sayfası —
  /** Liste kendi yüksekliğini içerikten alır; tavan sheet'i taşırmaz. */
  chapterList: { maxHeight: 58 * 7 },
  chapterListContent: { paddingBottom: Spacing.md },
  chapterListRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.screenX,
    height: 58,
  },
  chapterListIndex: { width: 26 },
  chapterListTitle: { flex: 1, minWidth: 0 },
  chapterListMark: { width: 8, height: 8, borderRadius: Radius.pill },
});
