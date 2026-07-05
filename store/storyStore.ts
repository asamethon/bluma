import { booksActions } from '@/features/story/services/books';
import { commentsActions } from '@/features/story/services/comments';
import { discoverActions } from '@/features/story/services/discover';
import { likesActions } from '@/features/story/services/likes';
import { listenersActions } from '@/features/story/services/listeners';
import { offlineActions } from '@/features/story/services/offline';
import { savesActions } from '@/features/story/services/saves';
import { storyApiActions } from '@/features/story/services/storyApi';
import { invalidateUserCache, userCacheActions } from '@/features/story/services/userCache';
import { viewsActions } from '@/features/story/services/views';

// Geriye dönük uyumluluk için: mevcut import edenler `storyStore`'dan
// `invalidateUserCache`/`StoryState` alıyordu.
export { invalidateUserCache };
export type { StoryState } from './slices/storySlice';

export const storyActions = {
  ...userCacheActions,
  ...storyApiActions,
  ...likesActions,
  ...savesActions,
  ...commentsActions,
  ...listenersActions,
  ...booksActions,
  ...discoverActions,
  ...viewsActions,
  ...offlineActions,
};
