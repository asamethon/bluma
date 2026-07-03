import { imageUploadService } from '@/services/imageUploadService';
import { authState$ } from '@/store/authStore';
import { storyActions, storyState$ } from '@/store/storyStore';
import { StoryCategory } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';

export type Chapter = { id: string; title: string; content: string };

// Yazma ekranının tüm form state'i + iş mantığı burada yaşar.
// app/(tabs)/write.tsx yalnızca bu hook'u çağırıp bileşen dizer.
export function useWriteForm() {
  const router = useRouter();
  const { user: currentUser } = authState$.get();
  const { isLoading } = storyState$.get();

  const [writeMode, setWriteMode] = useState<'quick' | 'advanced'>('quick');
  const [focusMode, setFocusMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [coverSheetVisible, setCoverSheetVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Story state
  const [storyTitle, setStoryTitle] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [storyCategory, setStoryCategory] = useState<StoryCategory>('other');
  const [storyDescription, setStoryDescription] = useState('');
  const [storyTags, setStoryTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMature, setIsMature] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: '1', title: 'Bölüm 1', content: '' },
  ]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null);

  // Keyboard dismiss on tab blur
  useFocusEffect(
    useCallback(() => {
      return () => { Keyboard.dismiss(); };
    }, [])
  );

  // Local draft persistence — survives app close / accidental navigation.
  // We keep the in-progress form in AsyncStorage (not Firestore) so we don't
  // spam the backend with throwaway documents on every keystroke.
  const draftKey = currentUser?.id ? `writeDraft_${currentUser.id}` : null;
  const restoredRef = useRef(false);

  const clearLocalDraft = useCallback(() => {
    if (draftKey) AsyncStorage.removeItem(draftKey).catch(() => {});
  }, [draftKey]);

  // Restore a previously saved draft once, on first mount with a known user.
  useEffect(() => {
    if (!draftKey || restoredRef.current) return;
    restoredRef.current = true;
    AsyncStorage.getItem(draftKey)
      .then(raw => {
        if (!raw) return;
        const d = JSON.parse(raw);
        if (!d || (!d.storyTitle?.trim() && !d.storyContent?.trim())) return;
        setWriteMode(d.writeMode ?? 'quick');
        setStoryTitle(d.storyTitle ?? '');
        setChapterTitle(d.chapterTitle ?? '');
        setStoryContent(d.storyContent ?? '');
        setStoryCategory(d.storyCategory ?? 'other');
        setStoryDescription(d.storyDescription ?? '');
        setStoryTags(Array.isArray(d.storyTags) ? d.storyTags : []);
        setCoverImage(d.coverImage ?? null);
        setIsCompleted(!!d.isCompleted);
        setIsMature(!!d.isMature);
        if (Array.isArray(d.chapters) && d.chapters.length > 0) setChapters(d.chapters);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      })
      .catch(() => {});
  }, [draftKey]);

  // Auto-save — debounced, writes the real form snapshot to AsyncStorage.
  useEffect(() => {
    if (!draftKey || !restoredRef.current) return;
    if (!storyTitle.trim() && !storyContent.trim() && !chapters.some(c => c.content.trim())) return;
    setAutoSaveStatus('saving');
    const t = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(draftKey, JSON.stringify({
          writeMode, storyTitle, chapterTitle, storyContent, storyCategory,
          storyDescription, storyTags, coverImage, isCompleted, isMature, chapters,
          savedAt: Date.now(),
        }));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      } catch {
        setAutoSaveStatus(null);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [draftKey, writeMode, storyTitle, chapterTitle, storyContent, storyCategory,
      storyDescription, storyTags, coverImage, isCompleted, chapters]);

  // Detaylı (advanced) modda gerçek içerik storyContent'te değil
  // chapters[i].content'te tutulur — buildStoryData ile aynı birleştirme
  // mantığı burada da kullanılmalı, yoksa kelime/karakter sayacı ve
  // yayınlama doğrulaması hep boş storyContent'e bakıp hiç ilerlemez.
  const effectiveContent = writeMode === 'quick'
    ? storyContent
    : chapters.map(c => c.content).join('\n§§\n');

  const wordCount = effectiveContent.trim() ? effectiveContent.trim().split(/\s+/).length : 0;
  const charCount = effectiveContent.length;
  const readMin = Math.max(1, Math.ceil(wordCount / 200));

  const getReadingTime = (text: string) =>
    Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(w => w).length / 200));

  const isValid = storyTitle.trim().length >= 3 && effectiveContent.trim().length >= 50;

  const resetForm = () => {
    setStoryTitle(''); setChapterTitle(''); setStoryContent('');
    setStoryCategory('other'); setStoryDescription(''); setStoryTags([]);
    setCoverImage(null); setIsCompleted(false); setIsMature(false); setWriteMode('quick');
    setChapters([{ id: '1', title: 'Bölüm 1', content: '' }]);
    setCurrentChapterIndex(0);
    setAutoSaveStatus(null);
    clearLocalDraft();
  };

  const buildStoryData = (isPublished: boolean) => {
    const content = effectiveContent;
    const data: any = {
      title: storyTitle.trim(),
      description: storyDescription.trim() || storyContent.substring(0, 200) + '...',
      content,
      category: storyCategory,
      tags: storyTags,
      isCompleted,
      isPublished,
      chaptersCount: writeMode === 'quick' ? 1 : chapters.length,
      readingTime: getReadingTime(content),
      isPremium: false,
      authorId: currentUser!.id,
      isBook: writeMode === 'advanced' && chapters.length > 1,
      targetAudience: isMature ? 'adult' : 'all',
    };
    if (coverImage) data.coverImage = coverImage;
    if (writeMode === 'advanced' && chapters.length > 1) {
      data.chapterTitles = chapters.map(c => c.title);
    } else if (writeMode === 'quick' && chapterTitle.trim()) {
      // Hızlı modda girilen bölüm başlığı da kaybolmasın — okuyucu
      // story.chapterTitles[0]'ı "Bölüm 1 — <başlık>" olarak gösterir.
      data.chapterTitles = [chapterTitle.trim()];
    }
    return data;
  };

  const validateAndWarn = (): boolean => {
    if (!currentUser?.id) {
      Alert.alert('Giriş gerekli', 'Devam etmek için giriş yapmalısın.');
      return false;
    }
    if (storyTitle.trim().length < 3) {
      Alert.alert('Başlık eksik', 'Hikaye başlığı en az 3 karakter olmalı.');
      return false;
    }
    if (effectiveContent.trim().length < 50) {
      Alert.alert('İçerik eksik', 'Hikaye içeriği en az 50 karakter olmalı.');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateAndWarn()) return;
    try {
      let coverUrl: string | undefined;
      if (coverImage && !coverImage.startsWith('http')) {
        try { coverUrl = await imageUploadService.uploadBookCover('temp', coverImage); } catch {}
      } else if (coverImage) {
        coverUrl = coverImage;
      }
      const data = buildStoryData(false);
      if (coverUrl) data.coverImage = coverUrl;
      const result = await storyActions.createStory(data);
      if (result.success) {
        clearLocalDraft();
        Alert.alert('Kaydedildi', 'Hikayen taslak olarak kaydedildi.', [
          { text: 'Profile git', onPress: () => router.push('/(tabs)/profile') },
          { text: 'Yeni hikaye', onPress: resetForm },
        ]);
      } else {
        Alert.alert('Hata', result.error || 'Hikaye kaydedilemedi.');
      }
    } catch {
      Alert.alert('Hata', 'Hikaye kaydedilemedi.');
    }
  };

  const handlePublish = async () => {
    if (!validateAndWarn()) return;
    // Yayınlanan her hikâye gerçek bir tür almalı — sessizce 'other' kaydı yok.
    if (storyCategory === 'other') {
      Alert.alert('Tür seç', 'Yayınlamadan önce hikâyen için bir tür seçmelisin.');
      return;
    }
    Alert.alert(
      'Hikayeyi yayınla',
      `"${storyTitle}" adlı hikayeni yayınlamak istiyor musun? (${wordCount} kelime, ~${readMin} dk okuma)`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Yayınla',
          onPress: async () => {
            try {
              let coverUrl: string | undefined;
              if (coverImage && !coverImage.startsWith('http')) {
                try { coverUrl = await imageUploadService.uploadBookCover('temp', coverImage); } catch {}
              } else if (coverImage) {
                coverUrl = coverImage;
              }
              const data = buildStoryData(true);
              if (coverUrl) data.coverImage = coverUrl;
              const result = await storyActions.createStory(data);
              if (result.success) {
                clearLocalDraft();
                Alert.alert('Harika!', 'Hikayen yayınlandı ve artık herkes okuyabilir.', [
                  { text: 'Profile git', onPress: () => router.push('/(tabs)/profile') },
                  { text: 'Yeni hikaye', onPress: resetForm },
                ]);
              } else {
                Alert.alert('Hata', result.error || 'Hikaye yayınlanamadı.');
              }
            } catch {
              Alert.alert('Hata', 'Hikaye yayınlanamadı.');
            }
          },
        },
      ]
    );
  };

  const handlePickCover = async () => {
    try {
      const uri = await imageUploadService.pickImageFromGallery();
      if (uri) setCoverImage(uri);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Resim seçilemedi.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const uri = await imageUploadService.takePhotoWithCamera();
      if (uri) setCoverImage(uri);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fotoğraf çekilemedi.');
    }
  };

  const handleAddChapter = () => {
    const next = [...chapters, { id: Date.now().toString(), title: `Bölüm ${chapters.length + 1}`, content: '' }];
    setChapters(next);
    setCurrentChapterIndex(next.length - 1);
  };

  const handleDeleteChapter = (i: number) => {
    if (chapters.length <= 1) return;
    const next = chapters.filter((_, idx) => idx !== i);
    setChapters(next);
    setCurrentChapterIndex(Math.max(0, currentChapterIndex - (i <= currentChapterIndex ? 1 : 0)));
  };

  const updateChapter = (i: number, field: 'title' | 'content', val: string) => {
    const next = [...chapters];
    next[i] = { ...next[i], [field]: val };
    setChapters(next);
  };

  const curChapter = chapters[currentChapterIndex] ?? chapters[0];
  const bodyText = writeMode === 'quick' ? storyContent : curChapter?.content ?? '';
  const setBodyText = (v: string) =>
    writeMode === 'quick' ? setStoryContent(v) : updateChapter(currentChapterIndex, 'content', v);

  // İmleç konumunu takip et — biçim yardımcıları metni imlecin olduğu yere ekler.
  const [bodySel, setBodySel] = useState({ start: 0, end: 0 });
  const insertAtCursor = (snippet: string) => {
    const text = bodyText;
    const start = Math.min(bodySel.start, text.length);
    const end = Math.min(bodySel.end, text.length);
    const next = text.slice(0, start) + snippet + text.slice(end);
    setBodyText(next);
    const caret = start + snippet.length;
    setBodySel({ start: caret, end: caret });
  };

  return {
    currentUser,
    isLoading,

    writeMode, setWriteMode,
    focusMode, setFocusMode,
    showAdvanced, setShowAdvanced,
    coverSheetVisible, setCoverSheetVisible,
    previewVisible, setPreviewVisible,

    storyTitle, setStoryTitle,
    chapterTitle, setChapterTitle,
    storyContent, setStoryContent,
    storyCategory, setStoryCategory,
    storyDescription, setStoryDescription,
    storyTags, setStoryTags,
    newTag, setNewTag,
    coverImage, setCoverImage,
    isCompleted, setIsCompleted,
    isMature, setIsMature,
    chapters, setChapters,
    currentChapterIndex, setCurrentChapterIndex,

    autoSaveStatus,

    wordCount, charCount, readMin, isValid,
    getReadingTime,
    resetForm,
    buildStoryData,
    validateAndWarn,
    handleSaveDraft,
    handlePublish,
    handlePickCover,
    handleTakePhoto,
    handleAddChapter,
    handleDeleteChapter,
    updateChapter,
    curChapter,
    bodyText,
    setBodyText,
    bodySel, setBodySel,
    insertAtCursor,
  };
}
