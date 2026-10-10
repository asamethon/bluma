import { chaptersActions } from '@/features/story/services/chapters';
import { chapterLikesActions } from '@/features/story/services/chapterLikes';
import { commentsActions } from '@/features/story/services/comments';
import { discoverActions } from '@/features/story/services/discover';
import { feedPaginationActions } from '@/features/story/services/feedPagination';
import { likesActions } from '@/features/story/services/likes';
import { listenersActions } from '@/features/story/services/listeners';
import { offlineActions } from '@/features/story/services/offline';
import { savesActions } from '@/features/story/services/saves';
import { storyApiActions } from '@/features/story/services/storyApi';
import { userCacheActions } from '@/features/story/services/userCache';
import { viewsActions } from '@/features/story/services/views';

export const storyActions = {
  ...userCacheActions,
  ...storyApiActions,
  ...likesActions,
  ...savesActions,
  ...commentsActions,
  ...listenersActions,
  ...chaptersActions,
  ...chapterLikesActions,
  ...discoverActions,
  ...feedPaginationActions,
  ...viewsActions,
  ...offlineActions,
};
