import type { Story } from '@/types';
import { logger } from '@/utils/logger';
import NetInfo from '@react-native-community/netinfo';
import { getChapter } from '../chapters';
import { getStoryById } from '../storyApi';
import { readOfflineChapter, readOfflineStories } from './storage';

async function isOnline(): Promise<boolean> {
  const netInfo = await NetInfo.fetch().catch(() => null);
  return Boolean(netInfo?.isConnected && netInfo.isInternetReachable);
}

export async function getStoryWithOfflineFallback(storyId: string): Promise<Story | null> {
  if (await isOnline()) {
    const story = await getStoryById(storyId).catch(error => {
      logger.error('Get story with offline fallback error:', error);
      return null;
    });
    if (story) return story;
  }
  const stored = await readOfflineStories();
  return stored.find(story => story.id === storyId) ?? null;
}

export async function getChapterWithOfflineFallback(
  storyId: string,
  index: number,
): Promise<{ title?: string; content: string; likesCount?: number } | null> {
  const chapter = await getChapter(storyId, index).catch(error => {
    logger.error('Get chapter with offline fallback error:', error);
    return null;
  });
  return chapter ?? (await readOfflineChapter(storyId, index));
}
