import { Comment, Story } from '@/types';
import { observable } from '@legendapp/state';

// storyState$ buradan ayrı tutulur: store/storyStore.ts servisleri
// (features/story/services/*) import ediyor, servisler de storyState$'a
// ihtiyaç duyuyordu — ikisi storyStore.ts üzerinden birbirine bağlanınca
// require cycle oluşuyordu (storyStore -> service -> storyStore).
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
