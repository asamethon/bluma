import i18n from '@/i18n';
import { imageUploadService } from '@/services/imageUploadService';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { StoryCategory } from '@/types';
import { defaultChapterTitle } from '../utils/chapterContent';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export function useStoryInfoForm(id?: string) {
  const router = useRouter();
  const uid = useAppSelector(s => s.auth.user?.id);
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StoryCategory>('other');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const [loadingStory, setLoadingStory] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [coverSheet, setCoverSheet] = useState(false);
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;
    let alive = true;
    (async () => {
      const story = await storyActions.getStoryById(id);
      if (!alive) return;
      if (!story) {
        Alert.alert(i18n.t('common.error'), i18n.t('story.notFound'));
        router.back();
        return;
      }
      setTitle(story.title || '');
      setCategory(story.category || 'other');
      setDescription(story.description || '');
      setCoverImage(story.coverImage || null);
      setLoadingStory(false);
    })();
    return () => { alive = false; };
  }, [id, isNew, router]);

  const pickCover = async () => {
    try {
      const uri = await imageUploadService.pickImageFromGallery();
      if (uri) setCoverImage(uri);
    } catch (e) {
      Alert.alert(i18n.t('common.error'), e instanceof Error ? e.message : i18n.t('imageUpload.pickError'));
    }
  };

  const takePhoto = async () => {
    try {
      const uri = await imageUploadService.takePhotoWithCamera();
      if (uri) setCoverImage(uri);
    } catch (e) {
      Alert.alert(i18n.t('common.error'), e instanceof Error ? e.message : i18n.t('imageUpload.captureError'));
    }
  };

  const resolveCover = async (storyId: string): Promise<string | undefined> => {
    if (!coverImage) return undefined;
    if (coverImage.startsWith('http')) return coverImage;
    try {
      return await imageUploadService.uploadBookCover(storyId, coverImage);
    } catch {
      return undefined;
    }
  };

  const save = async () => {
    if (!uid) {
      Alert.alert(i18n.t('studio.loginRequiredTitle'), i18n.t('studio.loginRequiredMessage'));
      return;
    }
    if (title.trim().length < 3) {
      setTitleError(true);
      Alert.alert(i18n.t('studio.titleMissingTitle'), i18n.t('studio.titleMissingMessage'));
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const result = await storyActions.createStory({
          title: title.trim(),
          description: description.trim(),
          content: '',
          category,
          tags: [],
          isCompleted: false,
          isPublished: false,
          chaptersCount: 1,
          chapterTitles: [defaultChapterTitle(1)],
          readingTime: 1,
          isPremium: false,
          authorId: uid,
          isBook: false,
        } as any);
        if (result.success && result.storyId) {
          const cover = await resolveCover(result.storyId);
          if (cover) await storyActions.updateStory(result.storyId, { coverImage: cover });
          router.replace(`/story/compose/${result.storyId}?ch=0`);
        } else {
          Alert.alert(i18n.t('common.error'), result.error || i18n.t('story.createFailed'));
        }
      } else {
        const cover = await resolveCover(id!);
        const updates: any = {
          title: title.trim(),
          description: description.trim(),
          category,
        };
        if (cover) updates.coverImage = cover;
        const result = await storyActions.updateStory(id!, updates);
        if (result.success) router.back();
        else Alert.alert(i18n.t('common.error'), result.error || i18n.t('story.updateFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (isNew || !id) return;
    Alert.alert(
      i18n.t('studio.deleteStoryTitle'),
      i18n.t('studio.deleteStoryMessage'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const result = await storyActions.deleteStory(id);
            if (result.success) router.replace('/(tabs)/write');
            else Alert.alert(i18n.t('common.error'), result.error || i18n.t('story.deleteFailed'));
          },
        },
      ],
    );
  };

  return {
    isNew,
    loadingStory,
    saving,
    title, setTitle,
    category, setCategory,
    description, setDescription,
    coverImage, setCoverImage,
    coverSheet, setCoverSheet,
    titleError, setTitleError,
    pickCover, takePhoto,
    save, remove,
    cancel: () => router.back(),
  };
}
