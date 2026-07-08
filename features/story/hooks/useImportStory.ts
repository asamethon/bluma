import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { StoryCategory } from '@/types';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { autoSplitPastedText, StudioChapter } from '../utils/chapterContent';
import { readingMinutes, wordCount } from '../utils/textStats';

// "Hikâyeni Taşı" — Wattpad'den (ya da başka bir kaynaktan) çok bölümlü bir
// metni tek seferde yapıştır, otomatik bölümlere ayrılsın, önizle, yayınla.
// Bkz. YAPILACAKLAR 2.6.
export function useImportStory() {
  const router = useRouter();
  const uid = useAppSelector(s => s.auth.user?.id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StoryCategory>('other');
  const [pastedText, setPastedText] = useState('');
  const [publishing, setPublishing] = useState(false);

  const chapters: StudioChapter[] = useMemo(
    () => autoSplitPastedText(pastedText),
    [pastedText]
  );

  const totalWords = useMemo(
    () => chapters.reduce((sum, c) => sum + wordCount(c.content), 0),
    [chapters]
  );

  const publish = async () => {
    if (!uid) {
      Alert.alert('Giriş gerekli', 'Devam etmek için giriş yapmalısın.');
      return;
    }
    if (title.trim().length < 3) {
      Alert.alert('Başlık eksik', 'Hikâye başlığı en az 3 karakter olmalı.');
      return;
    }
    if (category === 'other') {
      Alert.alert('Tür seç', 'Yayınlamadan önce bir tür seçmelisin.');
      return;
    }
    if (chapters.length === 0) {
      Alert.alert('İçerik eksik', 'Yapıştırdığın metinden bölüm çıkarılamadı.');
      return;
    }

    setPublishing(true);
    try {
      const readingTime = readingMinutes(chapters.map(c => c.content).join('\n\n'));
      const result = await storyActions.createStory({
        title: title.trim(),
        description: '',
        category,
        tags: [],
        isCompleted: false,
        isPublished: true,
        chaptersCount: chapters.length,
        chapterTitles: chapters.map(c => c.title),
        readingTime,
        isPremium: false,
        authorId: uid,
        isBook: chapters.length > 1,
      } as any);

      if (!result.success || !result.storyId) {
        Alert.alert('Hata', result.error || 'Hikâye oluşturulamadı.');
        return;
      }

      await storyActions.saveChapters(result.storyId, chapters);
      await storyActions.updateStory(result.storyId, {
        chaptersInSubcollection: true,
        chapterWordCounts: chapters.map(c => wordCount(c.content)),
      });

      Alert.alert('Harika!', `"${title.trim()}" ${chapters.length} bölümle yayınlandı.`);
      router.replace(`/story/${result.storyId}` as any);
    } finally {
      setPublishing(false);
    }
  };

  return {
    title, setTitle,
    category, setCategory,
    pastedText, setPastedText,
    chapters, totalWords,
    publishing, publish,
    cancel: () => router.back(),
  };
}
