import { Story } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineStory extends Story {
  downloadedAt: Date;
  size: number; // KB cinsinden dosya boyutu
}

interface DownloadProgress {
  storyId: string;
  progress: number; // 0-100 arası
  status: 'downloading' | 'completed' | 'failed';
}

class OfflineStorageService {
  private readonly OFFLINE_STORIES_KEY = '@bluma_offline_stories';
  private readonly DOWNLOAD_PROGRESS_KEY = '@bluma_download_progress';
  private readonly MAX_STORAGE_SIZE = 500 * 1024; // 500MB limit

  // Offline hikaye indir
  async downloadStory(story: Story): Promise<{ success: boolean; error?: string }> {
    try {
      // Önce storage limitini kontrol et
      const canDownload = await this.checkStorageLimit(story);
      if (!canDownload) {
        return { success: false, error: 'Yetersiz depolama alanı. Bazı hikayeleri silin.' };
      }

      // İndirme progress'ini başlat
      await this.updateDownloadProgress(story.id, 0, 'downloading');

      // Hikaye verilerini hesapla
      const storySize = this.calculateStorySize(story);
      
      // Offline story objesini oluştur
      const offlineStory: OfflineStory = {
        ...story,
        downloadedAt: new Date(),
        size: storySize,
      };

      // Progress güncelle
      await this.updateDownloadProgress(story.id, 50, 'downloading');

      // AsyncStorage'a kaydet
      await this.saveOfflineStory(offlineStory);

      // Progress tamamla
      await this.updateDownloadProgress(story.id, 100, 'completed');

      // Progress'i temizle (2 saniye sonra)
      setTimeout(() => {
        this.clearDownloadProgress(story.id);
      }, 2000);

      return { success: true };
    } catch (error) {
      console.error('Download story error:', error);
      await this.updateDownloadProgress(story.id, 0, 'failed');
      return { success: false, error: 'İndirme sırasında hata oluştu' };
    }
  }

  // Offline hikayeyi sil
  async deleteOfflineStory(storyId: string): Promise<boolean> {
    try {
      const offlineStories = await this.getOfflineStories();
      const updatedStories = offlineStories.filter(story => story.id !== storyId);
      
      await AsyncStorage.setItem(this.OFFLINE_STORIES_KEY, JSON.stringify(updatedStories));
      return true;
    } catch (error) {
      console.error('Delete offline story error:', error);
      return false;
    }
  }

  // Offline hikayeleri listele
  async getOfflineStories(): Promise<OfflineStory[]> {
    try {
      const storiesData = await AsyncStorage.getItem(this.OFFLINE_STORIES_KEY);
      if (!storiesData) return [];
      
      const stories: OfflineStory[] = JSON.parse(storiesData);
      return stories.map(story => ({
        ...story,
        downloadedAt: new Date(story.downloadedAt),
      }));
    } catch (error) {
      console.error('Get offline stories error:', error);
      return [];
    }
  }

  // Hikayenin offline olup olmadığını kontrol et
  async isStoryOffline(storyId: string): Promise<boolean> {
    try {
      const offlineStories = await this.getOfflineStories();
      return offlineStories.some(story => story.id === storyId);
    } catch (error) {
      console.error('Check story offline error:', error);
      return false;
    }
  }

  // Offline hikayeyi getir
  async getOfflineStory(storyId: string): Promise<OfflineStory | null> {
    try {
      const offlineStories = await this.getOfflineStories();
      return offlineStories.find(story => story.id === storyId) || null;
    } catch (error) {
      console.error('Get offline story error:', error);
      return null;
    }
  }

  // İndirme progress'ini güncelle
  async updateDownloadProgress(storyId: string, progress: number, status: DownloadProgress['status']): Promise<void> {
    try {
      const progressData: DownloadProgress = { storyId, progress, status };
      await AsyncStorage.setItem(`${this.DOWNLOAD_PROGRESS_KEY}_${storyId}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Update download progress error:', error);
    }
  }

  // İndirme progress'ini getir
  async getDownloadProgress(storyId: string): Promise<DownloadProgress | null> {
    try {
      const progressData = await AsyncStorage.getItem(`${this.DOWNLOAD_PROGRESS_KEY}_${storyId}`);
      return progressData ? JSON.parse(progressData) : null;
    } catch (error) {
      console.error('Get download progress error:', error);
      return null;
    }
  }

  // İndirme progress'ini temizle
  async clearDownloadProgress(storyId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.DOWNLOAD_PROGRESS_KEY}_${storyId}`);
    } catch (error) {
      console.error('Clear download progress error:', error);
    }
  }

  // Storage limitini kontrol et
  private async checkStorageLimit(story: Story): Promise<boolean> {
    try {
      const offlineStories = await this.getOfflineStories();
      const currentSize = offlineStories.reduce((total, s) => total + s.size, 0);
      const newStorySize = this.calculateStorySize(story);
      
      return (currentSize + newStorySize) <= this.MAX_STORAGE_SIZE;
    } catch (error) {
      console.error('Check storage limit error:', error);
      return false;
    }
  }

  // Hikaye boyutunu hesapla (KB)
  private calculateStorySize(story: Story): number {
    const contentSize = (story.content?.length || 0) * 2; // Unicode karakterler için x2
    const titleSize = (story.title?.length || 0) * 2;
    const descriptionSize = (story.description?.length || 0) * 2;
    const metadataSize = 1024; // Diğer metadata için sabit boyut
    
    return Math.ceil((contentSize + titleSize + descriptionSize + metadataSize) / 1024);
  }

  // Offline hikayeyi kaydet
  private async saveOfflineStory(offlineStory: OfflineStory): Promise<void> {
    try {
      const offlineStories = await this.getOfflineStories();
      
      // Aynı hikaye varsa güncelle, yoksa ekle
      const existingIndex = offlineStories.findIndex(story => story.id === offlineStory.id);
      if (existingIndex >= 0) {
        offlineStories[existingIndex] = offlineStory;
      } else {
        offlineStories.push(offlineStory);
      }
      
      await AsyncStorage.setItem(this.OFFLINE_STORIES_KEY, JSON.stringify(offlineStories));
    } catch (error) {
      console.error('Save offline story error:', error);
      throw error;
    }
  }

  // Toplam offline storage boyutunu getir
  async getTotalStorageSize(): Promise<{ used: number; total: number }> {
    try {
      const offlineStories = await this.getOfflineStories();
      const used = offlineStories.reduce((total, story) => total + story.size, 0);
      
      return {
        used, // KB
        total: this.MAX_STORAGE_SIZE, // KB
      };
    } catch (error) {
      console.error('Get storage size error:', error);
      return { used: 0, total: this.MAX_STORAGE_SIZE };
    }
  }

  // Tüm offline verileri temizle
  async clearAllOfflineData(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_STORIES_KEY);
      
      // Tüm progress key'leri temizle
      const allKeys = await AsyncStorage.getAllKeys();
      const progressKeys = allKeys.filter(key => key.startsWith(this.DOWNLOAD_PROGRESS_KEY));
      await AsyncStorage.multiRemove(progressKeys);
      
      return true;
    } catch (error) {
      console.error('Clear all offline data error:', error);
      return false;
    }
  }

  // Eski hikayeleri otomatik temizle (30 günden eski)
  async cleanupOldStories(): Promise<number> {
    try {
      const offlineStories = await this.getOfflineStories();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const freshStories = offlineStories.filter(story => 
        new Date(story.downloadedAt) > thirtyDaysAgo
      );
      
      const removedCount = offlineStories.length - freshStories.length;
      
      if (removedCount > 0) {
        await AsyncStorage.setItem(this.OFFLINE_STORIES_KEY, JSON.stringify(freshStories));
      }
      
      return removedCount;
    } catch (error) {
      console.error('Cleanup old stories error:', error);
      return 0;
    }
  }
}

export const offlineStorageService = new OfflineStorageService();