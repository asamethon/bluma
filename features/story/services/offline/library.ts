import i18n from '@/i18n';
import { store } from '@/store';
import { clearDownloadProgress, patchStory, setDownloadProgress } from '@/store/slices/storySlice';
import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import { loadAllChapters } from '../chapters';
import {
  MAX_STORAGE_KB,
  measureStory,
  readOfflineStories,
  removeAllOfflineData,
  removeOfflineStory,
  saveOfflineStory,
  type OfflineChapter,
} from './storage';

type DownloadResult = { success: boolean; error?: string };

export async function loadOfflineStories(): Promise<void> {
  const offlineStories = await readOfflineStories();
  store.dispatch(patchStory({ offlineStories }));
}

export async function downloadStoryOffline(story: Story): Promise<DownloadResult> {
  const report = (progress: number) => store.dispatch(setDownloadProgress({ storyId: story.id, progress }));
  report(0);
  try {
    const chapters = story.chaptersInSubcollection ? await readChapters(story.id) : undefined;
    if (story.chaptersInSubcollection && !chapters?.length) {
      return { success: false, error: i18n.t('offline.chaptersDownloadFailed') };
    }
    report(50);

    const size = measureStory(story, chapters);
    const stored = await readOfflineStories();
    // Aynı hikâyenin eski kopyası yeniden indirmede kotayı iki kez doldurmamalı.
    const usedByOthers = stored.reduce((total, item) => (item.id === story.id ? total : total + item.size), 0);
    if (usedByOthers + size > MAX_STORAGE_KB) {
      return { success: false, error: i18n.t('offline.insufficientStorage') };
    }

    await saveOfflineStory({ ...story, downloadedAt: new Date(), size }, chapters);
    report(100);
    await loadOfflineStories();
    return { success: true };
  } catch (error) {
    logger.error('Download story offline error:', error);
    return { success: false, error: i18n.t('offline.downloadError') };
  } finally {
    store.dispatch(clearDownloadProgress(story.id));
  }
}

export async function deleteOfflineStory(storyId: string): Promise<boolean> {
  try {
    await removeOfflineStory(storyId);
    await loadOfflineStories();
    return true;
  } catch (error) {
    logger.error('Delete offline story error:', error);
    return false;
  }
}

export async function clearAllOfflineData(): Promise<boolean> {
  try {
    await removeAllOfflineData();
    store.dispatch(patchStory({ offlineStories: [], isDownloading: {} }));
    return true;
  } catch (error) {
    logger.error('Clear all offline data error:', error);
    return false;
  }
}

export async function getOfflineStorageInfo(): Promise<{ used: number; total: number; count: number }> {
  const stored = await readOfflineStories();
  return {
    used: stored.reduce((total, story) => total + story.size, 0),
    total: MAX_STORAGE_KB,
    count: stored.length,
  };
}

async function readChapters(storyId: string): Promise<OfflineChapter[]> {
  const chapters = await loadAllChapters(storyId);
  return chapters.map(chapter => ({ title: chapter.title, content: chapter.content }));
}
