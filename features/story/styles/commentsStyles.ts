import type { Theme } from '@/constants/theme';
import { createCommentComposerStyles } from './comments/composer';
import { createCommentItemStyles } from './comments/item';
import { createCommentsChromeStyles } from './comments/chrome';

export const createCommentsStyles = (colors: Theme['colors']) => ({
  ...createCommentsChromeStyles(colors),
  ...createCommentItemStyles(colors),
  ...createCommentComposerStyles(colors),
});
