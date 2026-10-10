import type { Theme } from '@/constants/theme';
import { createConversationChromeStyles } from './detail/chrome';
import { createConversationCommentStyles } from './detail/comments';
import { createConversationComposerStyles } from './detail/composer';
import { createConversationPostStyles } from './detail/post';

export const createConversationDetailStyles = (colors: Theme['colors']) => ({
  ...createConversationChromeStyles(colors),
  ...createConversationPostStyles(colors),
  ...createConversationCommentStyles(colors),
  ...createConversationComposerStyles(colors),
});
