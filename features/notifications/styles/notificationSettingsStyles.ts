import type { Theme } from '@/constants/theme';
import { Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/** Bildirim ayarları — kart kutusu yok; gruplar SettingsGroup ritmini izler. */
export const createNotificationSettingsStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 60 },
    note: { marginTop: Spacing.xl, marginHorizontal: Spacing.screenX },
  });

