import { Fonts, Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const storyInfoFormStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.screenX, paddingBottom: Spacing.sm },
  coverWrap: { position: 'relative' },
  cover: {
    width: 108,
    height: 152,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverBtn: { position: 'absolute', right: -6, bottom: -6, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 15, lineHeight: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  keyboardFiller: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: -1 },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
});
