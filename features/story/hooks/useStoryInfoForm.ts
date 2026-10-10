import i18n from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { useRouter } from 'expo-router';
import { useEffect, useReducer } from 'react';
import { Alert } from 'react-native';
import { saveStoryInfo, type StoryInfoDraft } from '../services/storyInfo';
import { pickCoverImage } from '../services/coverImage';

type FormState = StoryInfoDraft & {
  loadingStory: boolean;
  saving: boolean;
  coverSheet: boolean;
  titleError: boolean;
};

const EMPTY: StoryInfoDraft = { title: '', category: 'other', description: '', coverImage: null };

/** Hikâye bilgi formu: alanlar, kapak seçimi ve kaydetme/silme akışı. */
export function useStoryInfoForm(id?: string) {
  const router = useRouter();
  const uid = useAppSelector(state => state.auth.user?.id);
  const isNew = !id;

  const [state, patch] = useReducer(
    (current: FormState, next: Partial<FormState>) => ({ ...current, ...next }),
    { ...EMPTY, loadingStory: !isNew, saving: false, coverSheet: false, titleError: false },
  );

  useEffect(() => {
    if (isNew || !id) return;
    const lifecycle = { active: true };
    void storyActions.getStoryById(id).then(story => {
      if (!lifecycle.active) return;
      if (!story) {
        Alert.alert(i18n.t('common.error'), i18n.t('story.notFound'));
        router.back();
        return;
      }
      patch({
        title: story.title || '',
        category: story.category || 'other',
        description: story.description || '',
        coverImage: story.coverImage || null,
        loadingStory: false,
      });
    });
    return () => { lifecycle.active = false; };
  }, [id, isNew, router]);

  const chooseCover = (source: 'gallery' | 'camera') => {
    void pickCoverImage(source).then(uri => {
      if (uri) patch({ coverImage: uri });
    });
  };

  const save = async () => {
    if (!uid) {
      Alert.alert(i18n.t('studio.loginRequiredTitle'), i18n.t('studio.loginRequiredMessage'));
      return;
    }
    if (state.title.trim().length < 3) {
      patch({ titleError: true });
      Alert.alert(i18n.t('studio.titleMissingTitle'), i18n.t('studio.titleMissingMessage'));
      return;
    }

    patch({ saving: true });
    try {
      const result = await saveStoryInfo({ storyId: id, authorId: uid, draft: state });
      if (!result.success) {
        Alert.alert(i18n.t('common.error'), result.error ?? i18n.t('story.updateFailed'));
        return;
      }
      if (result.createdStoryId) router.replace(`/story/compose/${result.createdStoryId}?ch=0`);
      else router.back();
    } finally {
      patch({ saving: false });
    }
  };

  const remove = () => {
    if (isNew || !id) return;
    Alert.alert(i18n.t('studio.deleteStoryTitle'), i18n.t('studio.deleteStoryMessage'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void storyActions.deleteStory(id).then(result => {
            if (result.success) router.replace('/(tabs)/write');
            else Alert.alert(i18n.t('common.error'), result.error || i18n.t('story.deleteFailed'));
          });
        },
      },
    ]);
  };

  return {
    ...state,
    isNew,
    setTitle: (title: string) => patch({ title, titleError: false }),
    setCategory: (category: StoryInfoDraft['category']) => patch({ category }),
    setDescription: (description: string) => patch({ description }),
    setCoverImage: (coverImage: string | null) => patch({ coverImage }),
    setCoverSheet: (coverSheet: boolean) => patch({ coverSheet }),
    pickCover: () => chooseCover('gallery'),
    takePhoto: () => chooseCover('camera'),
    save,
    remove,
    cancel: () => router.back(),
  };
}
