import { imageUploadService } from '@/services/imageUploadService';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { StoryCategory } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

// "Hikâye Bilgilerini Düzenle" — hikâye üstü meta veriler (başlık, tür,
// açıklama, kapak) yazma tuvalinden ayrı, kendi ekranında yaşar. Hem yeni
// hikâye (id yok) hem de mevcut hikâye düzenleme için ortak kullanılır.
// Not: klavye yüksekliği burada değil, StoryInfoForm bileşeninde
// useAnimatedKeyboard ile takip edilir (bkz. o dosyadaki yorum).
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

  // Mevcut hikâyeyi yükle (düzenleme modu).
  useEffect(() => {
    if (isNew || !id) return;
    let alive = true;
    (async () => {
      const story = await storyActions.getStoryById(id);
      if (!alive) return;
      if (!story) {
        Alert.alert('Hata', 'Hikâye bulunamadı.');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pickCover = async () => {
    try {
      const uri = await imageUploadService.pickImageFromGallery();
      if (uri) setCoverImage(uri);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Resim seçilemedi.');
    }
  };

  const takePhoto = async () => {
    try {
      const uri = await imageUploadService.takePhotoWithCamera();
      if (uri) setCoverImage(uri);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fotoğraf çekilemedi.');
    }
  };

  // Yerel (henüz yüklenmemiş) kapak resmini VPS görsel servisine yükler.
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
      Alert.alert('Giriş gerekli', 'Devam etmek için giriş yapmalısın.');
      return;
    }
    if (title.trim().length < 3) {
      setTitleError(true);
      Alert.alert('Başlık eksik', 'Hikâye başlığı en az 3 karakter olmalı.');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        // Yeni hikâye açık bir aksiyonla gerçek bir taslak dokümanı olur;
        // sonra composer bu taslağı düzenler (her tuşta çöp doküman yok).
        const result = await storyActions.createStory({
          title: title.trim(),
          description: description.trim(),
          content: '',
          category,
          tags: [],
          isCompleted: false,
          isPublished: false,
          chaptersCount: 1,
          chapterTitles: ['Bölüm 1'],
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
          Alert.alert('Hata', result.error || 'Hikâye oluşturulamadı.');
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
        else Alert.alert('Hata', result.error || 'Hikâye güncellenemedi.');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (isNew || !id) return;
    Alert.alert(
      'Hikâyeyi Sil',
      'Bu hikâyeyi ve tüm bölümlerini silmek istediğine emin misin? Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const result = await storyActions.deleteStory(id);
            if (result.success) router.replace('/(tabs)/write');
            else Alert.alert('Hata', result.error || 'Hikâye silinemedi.');
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
