import { useAppSelector } from '@/store/hooks';
import i18n from '@/i18n';
import { storyActions } from '@/store/storyStore';
import { Story } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useQuickDraft } from './useQuickDraft';

export function useWriteStudio() {
  const router = useRouter();
  const uid = useAppSelector(s => s.auth.user?.id);
  const stories = useAppSelector(s => s.story.userStories);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (uid) storyActions.loadUserStories(uid);
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await storyActions.loadUserStories(uid || '');
    setRefreshing(false);
  }, [uid]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(cur => (cur === id ? null : id)),
    [],
  );

  const { starting, startQuickDraft } = useQuickDraft();
  const newStory = useCallback(() => { void startQuickDraft(); }, [startQuickDraft]);

  const editInfo = useCallback(
    (id: string) => router.push(`/story/edit/${id}`),
    [router],
  );

  const openChapter = useCallback(
    (id: string, index: number) => router.push(`/story/compose/${id}?ch=${index}`),
    [router],
  );

  const addChapter = useCallback(
    (id: string) => router.push(`/story/compose/${id}?ch=new`),
    [router],
  );

  const launchStory = useCallback(
    (id: string) => router.push(`/story/${id}/launch` as never),
    [router],
  );

  const deleteStory = useCallback(
    (story: Story) => {
      Alert.alert(
        i18n.t('studio.deleteStoryTitle'),
        i18n.t('studio.deleteStoryNamedMessage', { title: story.title }),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          {
            text: i18n.t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              const result = await storyActions.deleteStory(story.id);
              if (result.success) load();
              else Alert.alert(i18n.t('common.error'), result.error || i18n.t('story.deleteFailed'));
            },
          },
        ],
      );
    },
    [load],
  );

  return {
    uid,
    stories,
    refreshing,
    onRefresh,
    expandedId,
    toggleExpand,
    newStory,
    starting,
    editInfo,
    openChapter,
    addChapter,
    launchStory,
    deleteStory,
  };
}
