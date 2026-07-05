import { offlineStorageService } from '@/services/offlineStorageService';
import { Story } from '@/types';
import NetInfo from '@react-native-community/netinfo';
import { store } from '@/store';
import { clearDownloadProgress, patchStory, setDownloadProgress } from '@/store/slices/storySlice';
import { getStoryById } from './storyApi';

// ===== OFFLINE STORY MANAGEMENT =====

// Offline hikayeleri yükle
export async function loadOfflineStories() {
  try {
    const offlineStories = await offlineStorageService.getOfflineStories();
    store.dispatch(patchStory({ offlineStories: offlineStories }));
  } catch (error) {
    console.error('Load offline stories error:', error);
  }
}

// Hikayeyi offline indir
export async function downloadStoryOffline(story: Story): Promise<{ success: boolean; error?: string }> {
  try {
    // İndirme durumunu başlat
    store.dispatch(setDownloadProgress({ storyId: story.id, progress: 0 }));

    // Progress listener'ı kur
    const progressInterval = setInterval(async () => {
      const progress = await offlineStorageService.getDownloadProgress(story.id);
      if (progress) {
        store.dispatch(setDownloadProgress({ storyId: story.id, progress: progress.progress }));

        if (progress.status === 'completed' || progress.status === 'failed') {
          clearInterval(progressInterval);
          // İndirme durumunu temizle
          store.dispatch(clearDownloadProgress(story.id));
        }
      }
    }, 100);

    // Hikayeyi indir
    const result = await offlineStorageService.downloadStory(story);

    if (result.success) {
      // Offline hikayeleri yenile
      await loadOfflineStories();
    }

    return result;
  } catch (error) {
    console.error('Download story offline error:', error);
    return { success: false, error: 'İndirme sırasında hata oluştu' };
  }
}

// Offline hikayeyi sil
export async function deleteOfflineStory(storyId: string): Promise<boolean> {
  try {
    const success = await offlineStorageService.deleteOfflineStory(storyId);
    if (success) {
      // State'i güncelle
      store.dispatch(patchStory({ offlineStories: store.getState().story.offlineStories.filter(story => story.id !== storyId) }));
    }
    return success;
  } catch (error) {
    console.error('Delete offline story error:', error);
    return false;
  }
}

// Hikayenin offline olup olmadığını kontrol et
export async function isStoryOffline(storyId: string): Promise<boolean> {
  try {
    return await offlineStorageService.isStoryOffline(storyId);
  } catch (error) {
    console.error('Check story offline error:', error);
    return false;
  }
}

// Offline hikayeyi getir (internet olmadan)
export async function getOfflineStory(storyId: string): Promise<Story | null> {
  try {
    return await offlineStorageService.getOfflineStory(storyId);
  } catch (error) {
    console.error('Get offline story error:', error);
    return null;
  }
}

// Offline storage bilgilerini getir
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
    console.error('Get offline storage info error:', error);
    return { used: 0, total: 500 * 1024, count: 0 };
  }
}

// Tüm offline verileri temizle
export async function clearAllOfflineData(): Promise<boolean> {
  try {
    const success = await offlineStorageService.clearAllOfflineData();
    if (success) {
      store.dispatch(patchStory({ offlineStories: [], isDownloading: {} }));
    }
    return success;
  } catch (error) {
    console.error('Clear all offline data error:', error);
    return false;
  }
}

// Eski offline hikayeleri temizle
export async function cleanupOldOfflineStories(): Promise<number> {
  try {
    const removedCount = await offlineStorageService.cleanupOldStories();
    if (removedCount > 0) {
      // State'i güncelle
      await loadOfflineStories();
    }
    return removedCount;
  } catch (error) {
    console.error('Cleanup old offline stories error:', error);
    return 0;
  }
}

// İndirme progress'ini getir
export function getDownloadProgress(storyId: string): number {
  return store.getState().story.isDownloading[storyId] || 0;
}

// Hikayenin indirilip indirilmediğini kontrol et
export function isStoryDownloading(storyId: string): boolean {
  return storyId in store.getState().story.isDownloading;
}

// ===== OFFLINE-AWARE STORY FETCHING =====

// Hikayeyi getir (offline fallback ile)
export async function getStoryWithOfflineFallback(storyId: string): Promise<Story | null> {
  try {
    // Önce internet bağlantısını kontrol et
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

    if (isOnline) {
      // Online ise Firebase'den getir
      const onlineStory = await getStoryById(storyId);
      if (onlineStory) {
        return onlineStory;
      }
    }

    // Offline ise veya online'da bulunamazsa offline'dan getir
    console.log('Fetching story from offline storage:', storyId);
    const offlineStory = await getOfflineStory(storyId);
    return offlineStory;
  } catch (error) {
    console.error('Get story with offline fallback error:', error);
    // Hata durumunda offline'dan getir
    return await getOfflineStory(storyId);
  }
}

// Hikayeleri listele (offline aware)
export async function getStoriesWithOfflineFallback(): Promise<{
  stories: Story[];
  isFromCache: boolean;
  offlineCount: number;
}> {
  try {
    // Önce internet bağlantısını kontrol et
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

    // Offline hikayeleri her zaman yükle
    const offlineStories = await offlineStorageService.getOfflineStories();

    if (isOnline) {
      // Online ise normal hikayeleri getir
      const currentStories = store.getState().story.stories;
      return {
        stories: currentStories,
        isFromCache: false,
        offlineCount: offlineStories.length,
      };
    } else {
      // Offline ise sadece offline hikayeleri göster
      return {
        stories: offlineStories,
        isFromCache: true,
        offlineCount: offlineStories.length,
      };
    }
  } catch (error) {
    console.error('Get stories with offline fallback error:', error);
    // Hata durumunda offline hikayeleri döndür
    const offlineStories = await offlineStorageService.getOfflineStories();
    return {
      stories: offlineStories,
      isFromCache: true,
      offlineCount: offlineStories.length,
    };
  }
}

// Internet bağlantısını kontrol et
export async function checkInternetConnection(): Promise<boolean> {
  try {
    const netInfo = await NetInfo.fetch();
    return Boolean(netInfo.isConnected && netInfo.isInternetReachable);
  } catch (error) {
    console.error('Check internet connection error:', error);
    return false;
  }
}

// Offline mode banner için bilgi
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
    console.error('Get offline mode info error:', error);
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
  checkInternetConnection,
  getOfflineModeInfo,
};
