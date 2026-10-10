import {
  clearAllOfflineData,
  deleteOfflineStory,
  downloadStoryOffline,
  getOfflineStorageInfo,
  loadOfflineStories,
} from './offline/library';
import { getChapterWithOfflineFallback, getStoryWithOfflineFallback } from './offline/fallback';

export const offlineActions = {
  clearAllOfflineData,
  deleteOfflineStory,
  downloadStoryOffline,
  getChapterWithOfflineFallback,
  getOfflineStorageInfo,
  getStoryWithOfflineFallback,
  loadOfflineStories,
};
