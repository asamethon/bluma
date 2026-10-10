import { Spacing, type Theme } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Editoryal ayarlar düzeni: gruplar kart kutusuna girmez. Grup başlığı büyük
 * harf bir künye, satırlar hairline ayraçla dizilir.
 */
export const createSettingsStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: Spacing.huge },
    section: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.section },
    sectionTitle: { marginBottom: Spacing.xs },
    sectionRule: { width: 20, height: 2, borderRadius: 1, marginBottom: Spacing.sm, backgroundColor: colors.primary },
    matureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
    matureCopy: { flex: 1, minWidth: 0 },
  });

