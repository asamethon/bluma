import { Radius, Spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const importStoryStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 8,
  },
  body: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 60,
  },
  titleInput: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16, lineHeight: 21,
    fontWeight: '600',
    marginBottom: 12,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pasteArea: {
    minHeight: 220,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    lineHeight: 20,
  },
  previewCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
