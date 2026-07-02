import { Comment, Story } from '@/types';

import { observable } from '@legendapp/state';
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
// `invalidateUserCache` alıyordu.
export { invalidateUserCache };

export interface StoryState {
  stories: Story[];
  discoverStories: Story[];
  followingStories: Story[];
  userStories: Story[];
  publishedUserStories: Story[];
  savedStories: Story[];
  likedStories: Story[];
  offlineStories: Story[];
  currentStory: Story | null;
  storyComments: Comment[];
  isLoading: boolean;
  /** True once the public stories feed has produced its first result (used to
   *  hold the splash screen so screens don't flash an empty state). */
  storiesLoaded: boolean;
  isDownloading: { [storyId: string]: number }; // progress 0-100
  error: string | null;
}

export const storyState$ = observable<StoryState>({
  stories: [],
  discoverStories: [],
  followingStories: [],
  userStories: [],
  publishedUserStories: [],
  savedStories: [],
  likedStories: [],
  offlineStories: [],
  currentStory: null,
  storyComments: [],
  isLoading: false,
  storiesLoaded: false,
  isDownloading: {},
  error: null,
});

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
