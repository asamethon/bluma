import { loadDiscoverStories, loadFollowingStories } from './discover';
import {
  cleanupCommentsListener,
  loadMoreComments,
  setupCommentsListener,
} from './listeners/commentsListener';
import { setupStoryDetailListener } from './listeners/storyDetailListener';
import {
  cleanupStoryFeedListeners,
  setupPublishedUserStoriesListener,
  setupStoriesListener,
} from './listeners/storyFeedListeners';
import {
  cleanupStoryLibraryListeners,
  setupStoryLibraryListeners,
} from './listeners/storyLibraryListeners';
import { loadOfflineStories } from './offline/library';

function initializeRealTimeListeners() {
  setupStoriesListener();
  setupStoryLibraryListeners();
  void loadDiscoverStories();
  void loadFollowingStories();
  void loadOfflineStories();
}

function cleanupRealTimeListeners() {
  cleanupStoryFeedListeners();
  cleanupStoryLibraryListeners();
  cleanupCommentsListener();
}

export const listenersActions = {
  cleanupCommentsListener,
  cleanupRealTimeListeners,
  initializeRealTimeListeners,
  loadMoreComments,
  setupCommentsListener,
  setupPublishedUserStoriesListener,
  setupStoriesListener,
  setupStoryDetailListener,
};
