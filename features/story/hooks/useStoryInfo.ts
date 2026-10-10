import { useGuestGate } from '@/contexts/GuestContext';
import { readingProgressActions } from '@/features/story/services/readingProgress';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import type { Story } from '@/types';
import { buildStoryShareUrl } from '@/utils/deepLinks';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Share } from 'react-native';

type State = { loaded: Story | null; loading: boolean; saved: boolean; savedChapter: number | null; shareVisible: boolean };
type Action =
  | { type: 'loaded'; value: Story | null }
  | { type: 'loading'; value: boolean }
  | { type: 'saved'; value: boolean }
  | { type: 'chapter'; value: number | null }
  | { type: 'share'; value: boolean };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'loaded') return { ...state, loaded: action.value };
  if (action.type === 'loading') return { ...state, loading: action.value };
  if (action.type === 'saved') return { ...state, saved: action.value };
  if (action.type === 'chapter') return { ...state, savedChapter: action.value };
  return { ...state, shareVisible: action.value };
};

export function useStoryInfo(storyId: string) {
  const { t } = useTranslation();
  const router = useRouter();
  const { requireAuth } = useGuestGate();
  const liveStory = useAppSelector(state => state.story.currentStory);
  const downloaded = useAppSelector(state => state.story.offlineStories.some(story => story.id === storyId));
  const downloadProgress = useAppSelector(state => state.story.isDownloading[storyId]);
  const [state, dispatch] = useReducer(reducer, {
    loaded: null, loading: true, saved: false, savedChapter: null, shareVisible: false,
  });
  const story = liveStory?.id === storyId ? liveStory : state.loaded;

  useEffect(() => {
    const lifecycle = { active: true };
    dispatch({ type: 'loading', value: true });
    const unsubscribe = storyActions.setupStoryDetailListener(storyId);
    void Promise.all([
      storyActions.getStoryWithOfflineFallback(storyId),
      storyActions.isStorySaved(storyId),
      readingProgressActions.getReadingProgress(storyId),
    ]).then(([loaded, saved, progress]) => {
      if (!lifecycle.active) return;
      dispatch({ type: 'loaded', value: loaded });
      dispatch({ type: 'saved', value: saved });
      dispatch({ type: 'chapter', value: progress?.chapterIndex && progress.chapterIndex > 0 ? progress.chapterIndex : null });
    }).catch(error => logger.error('Load story info error', error)).finally(() => {
      if (lifecycle.active) dispatch({ type: 'loading', value: false });
    });
    return () => {
      lifecycle.active = false;
      unsubscribe?.();
    };
  }, [storyId]);

  const toggleSave = useCallback(() => {
    if (!story || !requireAuth('save')) return;
    const previous = state.saved;
    dispatch({ type: 'saved', value: !previous });
    void storyActions.saveStory(story.id).then(result => {
      if (!result.success) dispatch({ type: 'saved', value: previous });
    });
  }, [requireAuth, state.saved, story]);
  const toggleDownload = useCallback(() => {
    if (!story || downloadProgress !== undefined) return;
    if (downloaded) {
      Alert.alert(t('storyScreen.removeOfflineTitle'), t('storyScreen.removeOfflineConfirm', { title: story.title }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('lists.remove'), style: 'destructive', onPress: () => void storyActions.deleteOfflineStory(story.id) },
      ]);
      return;
    }
    void storyActions.downloadStoryOffline(story).then(result => {
      if (!result.success) Alert.alert(t('storyScreen.downloadFailedTitle'), result.error || t('storyScreen.downloadFailedMessage'));
    });
  }, [downloadProgress, downloaded, story, t]);
  const startReading = useCallback((chapterIndex = 0) => {
    if (!story) return;
    void storyActions.incrementStoryViews(story.id);
    router.push(chapterIndex > 0 ? `/story/${story.id}?chapter=${chapterIndex}` as never : `/story/${story.id}` as never);
  }, [router, story]);
  const shareLink = useCallback(async () => {
    const url = buildStoryShareUrl(storyId);
    try {
      await Share.share({ title: story?.title || 'Bluma', message: story?.title ? t('storyScreen.shareMessage', { title: story.title, url }) : url });
    } catch (error) {
      logger.error('Share error', error);
    }
  }, [story, storyId, t]);

  return {
    ...state,
    story,
    downloaded,
    downloading: downloadProgress !== undefined,
    closeShare: () => dispatch({ type: 'share', value: false }),
    openShare: () => dispatch({ type: 'share', value: true }),
    shareLink,
    startReading,
    toggleDownload,
    toggleSave,
  };
}
