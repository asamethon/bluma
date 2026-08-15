import { offlineStorageService, OfflineChapter } from '@/services/offlineStorageService';
import i18n from '@/i18n';
import { Story } from '@/types';
import NetInfo from '@react-native-community/netinfo';
import { store } from '@/store';
import { clearDownloadProgress, patchStory, setDownloadProgress } from '@/store/slices/storySlice';
import { getChapter, loadAllChapters } from './chapters';
import { getStoryById } from './storyApi';
import { logger } from '@/utils/logger';

export async function loadOfflineStories() {
  try {
    const offlineStories = await offlineStorageService.getOfflineStories();
    store.dispatch(patchStory({ offlineStories: offlineStories }));
  } catch (error) {
    logger.error('Load offline stories error:', error);
  }
}

export async function downloadStoryOffline(story: Story): Promise<{ success: boolean; error?: string }> {
  store.dispatch(setDownloadProgress({ storyId: story.id, progress: 0 }));

  const progressInterval = setInterval(async () => {
    const progress = await offlineStorageService.getDownloadProgress(story.id);
    if (progress) {
      store.dispatch(setDownloadProgress({ storyId: story.id, progress: progress.progress }));
    }
  }, 250);

  try {
    let chapters: OfflineChapter[] | undefined;
    if (story.chaptersInSubcollection) {
      const all = await loadAllChapters(story.id);
      chapters = all.map((c) => ({ title: c.title, content: c.content }));
      if (chapters.length === 0) {
        return { success: false, error: i18n.t('offline.chaptersDownloadFailed') };
      }
    }

    const result = await offlineStorageService.downloadStory(story, chapters);

    if (result.success) {
      await loadOfflineStories();
    }

    return result;
  } catch (error) {
    logger.error('Download story offline error:', error);
    return { success: false, error: i18n.t('offline.downloadError') };
  } finally {
    clearInterval(progressInterval);
    store.dispatch(clearDownloadProgress(story.id));
  }
}

export async function deleteOfflineStory(storyId: string): Promise<boolean> {
  try {
    const success = await offlineStorageService.deleteOfflineStory(storyId);
    if (success) {
      store.dispatch(patchStory({ offlineStories: store.getState().story.offlineStories.filter(story => story.id !== storyId) }));
    }
    return success;
  } catch (error) {
    logger.error('Delete offline story error:', error);
    return false;
  }
}

export async function isStoryOffline(storyId: string): Promise<boolean> {
  try {
    return await offlineStorageService.isStoryOffline(storyId);
  } catch (error) {
    logger.error('Check story offline error:', error);
    return false;
  }
}

export async function getOfflineStory(storyId: string): Promise<Story | null> {
  try {
    return await offlineStorageService.getOfflineStory(storyId);
  } catch (error) {
    logger.error('Get offline story error:', error);
    return null;
  }
}

export async function getOfflineStorageInfo(): Promise<{ used: number; total: number; count: number }> {
  try {
    const sizeInfo = await offlineStorageService.getTotalStorageSize();
    const offlineStories = await offlineStorageService.getOfflineStories();

    return {
      used: sizeInfo.used,
      total: sizeInfo.total,
      count: offlineStories.length,
    };
  } catch (error) {
    logger.error('Get offline storage info error:', error);
    return { used: 0, total: 500 * 1024, count: 0 };
  }
}

export async function clearAllOfflineData(): Promise<boolean> {
  try {
    const success = await offlineStorageService.clearAllOfflineData();
    if (success) {
      store.dispatch(patchStory({ offlineStories: [], isDownloading: {} }));
    }
    return success;
  } catch (error) {
    logger.error('Clear all offline data error:', error);
    return false;
  }
}

export async function cleanupOldOfflineStories(): Promise<number> {
  try {
    const removedCount = await offlineStorageService.cleanupOldStories();
    if (removedCount > 0) {
      await loadOfflineStories();
    }
    return removedCount;
  } catch (error) {
    logger.error('Cleanup old offline stories error:', error);
    return 0;
  }
}

export function getDownloadProgress(storyId: string): number {
  return store.getState().story.isDownloading[storyId] || 0;
}

export function isStoryDownloading(storyId: string): boolean {
  return storyId in store.getState().story.isDownloading;
}

export async function getStoryWithOfflineFallback(storyId: string): Promise<Story | null> {
  try {
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

    if (isOnline) {
      const onlineStory = await getStoryById(storyId);
      if (onlineStory) {
        return onlineStory;
      }
    }

    logger.debug('Fetching story from offline storage:', storyId);
    const offlineStory = await getOfflineStory(storyId);
    return offlineStory;
  } catch (error) {
    logger.error('Get story with offline fallback error:', error);
    return await getOfflineStory(storyId);
  }
}

export async function getChapterWithOfflineFallback(
  storyId: string,
  index: number
): Promise<{ title?: string; content: string } | null> {
  try {
    const ch = await getChapter(storyId, index);
    if (ch) return ch;
  } catch (e) {
    logger.error('Get chapter with offline fallback error (Firestore):', e);
  }
  return await offlineStorageService.getOfflineChapter(storyId, index);
}

export async function getStoriesWithOfflineFallback(): Promise<{
  stories: Story[];
  isFromCache: boolean;
  offlineCount: number;
}> {
  try {
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

    const offlineStories = await offlineStorageService.getOfflineStories();

    if (isOnline) {
      const currentStories = store.getState().story.stories;
      return {
        stories: currentStories,
        isFromCache: false,
        offlineCount: offlineStories.length,
      };
    } else {
      return {
        stories: offlineStories,
        isFromCache: true,
        offlineCount: offlineStories.length,
      };
    }
  } catch (error) {
    logger.error('Get stories with offline fallback error:', error);
    const offlineStories = await offlineStorageService.getOfflineStories();
    return {
      stories: offlineStories,
      isFromCache: true,
      offlineCount: offlineStories.length,
    };
  }
}

export async function checkInternetConnection(): Promise<boolean> {
  try {
    const netInfo = await NetInfo.fetch();
    return Boolean(netInfo.isConnected && netInfo.isInternetReachable);
  } catch (error) {
    logger.error('Check internet connection error:', error);
    return false;
  }
}

export async function getOfflineModeInfo(): Promise<{
  isOffline: boolean;
  offlineStoriesCount: number;
  lastSync?: Date;
}> {
  try {
    const isOnline = await checkInternetConnection();
    const offlineStories = await offlineStorageService.getOfflineStories();

    return {
      isOffline: !isOnline,
      offlineStoriesCount: offlineStories.length,
      lastSync: offlineStories.length > 0
        ? new Date(Math.max(...offlineStories.map(s => new Date(s.downloadedAt || 0).getTime())))
        : undefined,
    };
  } catch (error) {
    logger.error('Get offline mode info error:', error);
    return {
      isOffline: true,
      offlineStoriesCount: 0,
    };
  }
}

export const offlineActions = {
  loadOfflineStories,
  downloadStoryOffline,
  deleteOfflineStory,
  isStoryOffline,
  getOfflineStory,
  getOfflineStorageInfo,
  clearAllOfflineData,
  cleanupOldOfflineStories,
  getDownloadProgress,
  isStoryDownloading,
  getStoryWithOfflineFallback,
  getStoriesWithOfflineFallback,
  getChapterWithOfflineFallback,
  checkInternetConnection,
  getOfflineModeInfo,
};
