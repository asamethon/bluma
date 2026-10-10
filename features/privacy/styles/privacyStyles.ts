import type { Theme } from '@/constants/theme';
import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Gizlilik ekranı — satırlar SettingsGroup/ListRow ritmini izler. */
export const createPrivacyStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 60 },
    intro: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.lg },
    notes: { paddingHorizontal: Spacing.screenX, marginTop: Spacing.xl, gap: Spacing.md },
  });
