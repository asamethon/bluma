import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const pushPromptStyles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  iconBox: {
    width: 60, height: 60, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  title: { textAlign: 'center', marginBottom: Spacing.sm },
  sub: { textAlign: 'center', marginBottom: Spacing.xl, maxWidth: 320 },
  skip: { paddingVertical: 12, marginTop: 4 },
  banner: { marginHorizontal: Spacing.screenX, marginTop: Spacing.md, marginBottom: Spacing.md },
  bannerActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
});
