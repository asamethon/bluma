import { loadFollowingStories } from './discover';
import {
  cleanupCommentsListener,
  loadMoreComments,
  setupCommentsListener,
} from './listeners/commentsListener';
import { setupStoryDetailListener } from './listeners/storyDetailListener';
import {
  cleanupStoryFeedListeners,
  loadStoriesFeed,
  setupPublishedUserStoriesListener,
} from './listeners/storyFeedListeners';
import {
  cleanupStoryLibraryListeners,
  setupStoryLibraryListeners,
} from './listeners/storyLibraryListeners';
import { loadOfflineStories } from './offline/library';

/**
 * Oturum açık kullanıcının akış verisi. Birden çok ekran (ana sayfa, profil)
 * çağırabilir: akış ve takip rafı 10 dk içinde tekrar okunmaz, kitaplık
 * dinleyicileri tekildir.
 */
function initializeRealTimeListeners() {
  void loadStoriesFeed();
  setupStoryLibraryListeners();
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
  loadStoriesFeed,
  setupCommentsListener,
  setupPublishedUserStoriesListener,
  setupStoryDetailListener,
  setupStoryLibraryListeners,
};
