import { Story } from '@/types';
import i18n from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

interface OfflineStory extends Story {
  downloadedAt: Date;
  size: number;
}

export interface OfflineChapter {
  title?: string;
  content: string;
}

interface DownloadProgress {
  storyId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed';
}

class OfflineStorageService {
  private readonly OFFLINE_STORIES_KEY = '@bluma_offline_stories';
  private readonly DOWNLOAD_PROGRESS_KEY = '@bluma_download_progress';
  private readonly OFFLINE_CHAPTERS_KEY = '@bluma_offline_chapters';
  private readonly MAX_STORAGE_SIZE = 500 * 1024;

  private chaptersKey(storyId: string): string {
    return `${this.OFFLINE_CHAPTERS_KEY}_${storyId}`;
  }

  async downloadStory(story: Story, chapters?: OfflineChapter[]): Promise<{ success: boolean; error?: string }> {
    try {
      const canDownload = await this.checkStorageLimit(story, chapters);
      if (!canDownload) {
        return { success: false, error: i18n.t('offline.insufficientStorage') };
      }

      await this.updateDownloadProgress(story.id, 0, 'downloading');

      const storySize = this.calculateStorySize(story, chapters);

      const offlineStory: OfflineStory = {
        ...story,
        downloadedAt: new Date(),
        size: storySize,
      };

      await this.updateDownloadProgress(story.id, 50, 'downloading');

      if (chapters && chapters.length > 0) {
        await AsyncStorage.setItem(this.chaptersKey(story.id), JSON.stringify(chapters));
      }
      await this.saveOfflineStory(offlineStory);

      await this.updateDownloadProgress(story.id, 100, 'completed');

      setTimeout(() => {
        this.clearDownloadProgress(story.id);
      }, 2000);

      return { success: true };
    } catch (error) {
      logger.error('Download story error:', error);
      await this.updateDownloadProgress(story.id, 0, 'failed');
      return { success: false, error: i18n.t('offline.downloadError') };
    }
  }

  async deleteOfflineStory(storyId: string): Promise<boolean> {
    try {
      const offlineStories = await this.getOfflineStories();
      const updatedStories = offlineStories.filter(story => story.id !== storyId);

      await AsyncStorage.setItem(this.OFFLINE_STORIES_KEY, JSON.stringify(updatedStories));
      await AsyncStorage.removeItem(this.chaptersKey(storyId)).catch(() => {});
      return true;
    } catch (error) {
      logger.error('Delete offline story error:', error);
      return false;
    }
  }

  async getOfflineChapters(storyId: string): Promise<OfflineChapter[] | null> {
    try {
      const raw = await AsyncStorage.getItem(this.chaptersKey(storyId));
      return raw ? (JSON.parse(raw) as OfflineChapter[]) : null;
    } catch (error) {
      logger.error('Get offline chapters error:', error);
      return null;
    }
  }

  async getOfflineChapter(storyId: string, index: number): Promise<OfflineChapter | null> {
    const chapters = await this.getOfflineChapters(storyId);
    return chapters && chapters[index] ? chapters[index] : null;
  }

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
      logger.error('Get offline stories error:', error);
      return [];
    }
  }

  async isStoryOffline(storyId: string): Promise<boolean> {
    try {
      const offlineStories = await this.getOfflineStories();
      return offlineStories.some(story => story.id === storyId);
    } catch (error) {
      logger.error('Check story offline error:', error);
      return false;
    }
  }

  async getOfflineStory(storyId: string): Promise<OfflineStory | null> {
    try {
      const offlineStories = await this.getOfflineStories();
      return offlineStories.find(story => story.id === storyId) || null;
    } catch (error) {
      logger.error('Get offline story error:', error);
      return null;
    }
  }

  async updateDownloadProgress(storyId: string, progress: number, status: DownloadProgress['status']): Promise<void> {
    try {
      const progressData: DownloadProgress = { storyId, progress, status };
      await AsyncStorage.setItem(`${this.DOWNLOAD_PROGRESS_KEY}_${storyId}`, JSON.stringify(progressData));
    } catch (error) {
      logger.error('Update download progress error:', error);
    }
  }

  async getDownloadProgress(storyId: string): Promise<DownloadProgress | null> {
    try {
      const progressData = await AsyncStorage.getItem(`${this.DOWNLOAD_PROGRESS_KEY}_${storyId}`);
      return progressData ? JSON.parse(progressData) : null;
    } catch (error) {
      logger.error('Get download progress error:', error);
      return null;
    }
  }

  async clearDownloadProgress(storyId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.DOWNLOAD_PROGRESS_KEY}_${storyId}`);
    } catch (error) {
      logger.error('Clear download progress error:', error);
    }
  }

  private async checkStorageLimit(story: Story, chapters?: OfflineChapter[]): Promise<boolean> {
    try {
      const offlineStories = await this.getOfflineStories();
      const currentSize = offlineStories.reduce((total, s) => total + s.size, 0);
      const newStorySize = this.calculateStorySize(story, chapters);

      return (currentSize + newStorySize) <= this.MAX_STORAGE_SIZE;
    } catch (error) {
      logger.error('Check storage limit error:', error);
      return false;
    }
  }

  private calculateStorySize(story: Story, chapters?: OfflineChapter[]): number {
    const bodyLength = chapters && chapters.length > 0
      ? chapters.reduce((total, c) => total + (c.content?.length || 0), 0)
      : (story.content?.length || 0);
    const contentSize = bodyLength * 2;
    const titleSize = (story.title?.length || 0) * 2;
    const descriptionSize = (story.description?.length || 0) * 2;
    const metadataSize = 1024;

    return Math.ceil((contentSize + titleSize + descriptionSize + metadataSize) / 1024);
  }

  private async saveOfflineStory(offlineStory: OfflineStory): Promise<void> {
    try {
      const offlineStories = await this.getOfflineStories();
      
      const existingIndex = offlineStories.findIndex(story => story.id === offlineStory.id);
      if (existingIndex >= 0) {
        offlineStories[existingIndex] = offlineStory;
      } else {
        offlineStories.push(offlineStory);
      }
      
      await AsyncStorage.setItem(this.OFFLINE_STORIES_KEY, JSON.stringify(offlineStories));
    } catch (error) {
      logger.error('Save offline story error:', error);
      throw error;
    }
  }

  async getTotalStorageSize(): Promise<{ used: number; total: number }> {
    try {
      const offlineStories = await this.getOfflineStories();
      const used = offlineStories.reduce((total, story) => total + story.size, 0);
      
      return {
        used,
        total: this.MAX_STORAGE_SIZE,
      };
    } catch (error) {
      logger.error('Get storage size error:', error);
      return { used: 0, total: this.MAX_STORAGE_SIZE };
    }
  }

  async clearAllOfflineData(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_STORIES_KEY);

      const allKeys = await AsyncStorage.getAllKeys();
      const staleKeys = allKeys.filter(
        key => key.startsWith(this.DOWNLOAD_PROGRESS_KEY) || key.startsWith(this.OFFLINE_CHAPTERS_KEY)
      );
      if (staleKeys.length > 0) await AsyncStorage.multiRemove(staleKeys);

      return true;
    } catch (error) {
      logger.error('Clear all offline data error:', error);
      return false;
    }
  }

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
        const freshIds = new Set(freshStories.map(s => s.id));
        const removedIds = offlineStories.filter(s => !freshIds.has(s.id)).map(s => s.id);
        await AsyncStorage.multiRemove(removedIds.map(id => this.chaptersKey(id))).catch(() => {});
      }

      return removedCount;
    } catch (error) {
      logger.error('Cleanup old stories error:', error);
      return 0;
    }
  }
}

export const offlineStorageService = new OfflineStorageService();