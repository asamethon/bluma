import { imageUploadService } from '@/services/imageUploadService';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { StoryCategory } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Keyboard } from 'react-native';
import { categories, commonContentWarnings, languages, targetAudiences } from '../constants/editFormOptions';

export type EditChapter = { id: string; title: string; content: string; isPublished: boolean };

// Hikaye düzenleme ekranının tüm state + iş mantığı burada yaşar.
// Ekran (`app/story/edit/[id].tsx`) yalnızca bu hook'u çağırıp bileşen dizer.
export function useEditStoryForm(id: string | string[] | undefined) {
  const router = useRouter();
  const currentUser = useAppSelector(s => s.auth.user);
  const isLoading = useAppSelector(s => s.story.isLoading);

  // Loading states
  const [isLoadingStory, setIsLoadingStory] = useState(true);
  const [storyData, setStoryData] = useState<any>(null);

  // UI Mode States
  const [writeMode, setWriteMode] = useState<'quick' | 'advanced'>('quick');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Core story state (simplified)
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [storyCategory, setStoryCategory] = useState<StoryCategory>('other');

  // Animation values
  const modeTabAnim = useState(new Animated.Value(writeMode === 'quick' ? 0 : 1))[0];

  // Label animations for each input
  const titleLabelAnim = useState(new Animated.Value(0))[0];
  const contentLabelAnim = useState(new Animated.Value(0))[0];
  const descriptionLabelAnim = useState(new Animated.Value(0))[0];
  const chapterTitleLabelAnim = useState(new Animated.Value(0))[0];
  const chapterContentLabelAnim = useState(new Animated.Value(0))[0];

  // Advanced options (for both modes now)
  const [storyDescription, setStoryDescription] = useState('');
  const [storyTags, setStoryTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'teen' | 'adult'>('all');
  const [language, setLanguage] = useState('Türkçe');
  const [contentWarnings, setContentWarnings] = useState<string[]>([]);

  // Chapter state (for advanced mode)
  const [chapters, setChapters] = useState<EditChapter[]>([
    { id: '1', title: 'Bölüm 1', content: '', isPublished: false }
  ]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // UI state
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  const loadStoryData = useCallback(async (storyId: string) => {
    try {
      setIsLoadingStory(true);

      // Get story from store or fetch from API
      const stories = store.getState().story.stories;
      let story = stories.find(s => s.id === storyId);

      if (!story) {
        // If not in store, we might need to fetch it
        // For now, let's redirect back
        Alert.alert('Hata', 'Hikaye bulunamadı.');
        router.back();
        return;
      }

      // Check if user owns this story
      if (story.authorId !== currentUser?.id) {
        Alert.alert('Hata', 'Bu hikayeyi düzenleme yetkiniz yok.');
        router.back();
        return;
      }

      setStoryData(story);

      // Populate form with story data
      setStoryTitle(story.title || '');
      setStoryCategory(story.category || 'other');
      setStoryTags(story.tags || []);
      setStoryDescription(story.description || '');
      setCoverImage(story.coverImage || null);
      setIsCompleted(story.isCompleted || false);
      setTargetAudience(story.targetAudience || 'all');
      setLanguage(story.language || 'Türkçe');
      setContentWarnings(story.contentWarnings || []);

      // Handle content based on story type
      if (story.isBook && story.chapterTitles && story.chapterTitles.length > 1) {
        // Multi-chapter book — okuyucudaki splitChapters ile aynı mantık:
        // yeni format benzersiz ayraçla bölünür; eski (ayraçsız) içerikte
        // paragraflar bölüm sayısına eşit dağıtılır. Naif \n\n bölmesi her
        // paragrafı ayrı bölüm sanıyor ve içeriği kaydırıyordu.
        setWriteMode('advanced');
        const CHAPTER_SEP = '\n§§\n';
        const raw = story.content || '';
        let storyChapters: string[];
        if (raw.includes(CHAPTER_SEP)) {
          storyChapters = raw.split(CHAPTER_SEP);
        } else {
          const n = story.chapterTitles.length;
          const paras = raw.split('\n\n').filter((p: string) => p.trim().length > 0);
          const perChap = Math.ceil(paras.length / n) || 1;
          storyChapters = Array.from({ length: n }, (_, i) =>
            paras.slice(i * perChap, (i + 1) * perChap).join('\n\n')
          );
        }
        const chaptersData = story.chapterTitles.map((title: string, index: number) => ({
          id: (index + 1).toString(),
          title: title || `Bölüm ${index + 1}`,
          content: storyChapters[index] || '',
          isPublished: true
        }));
        setChapters(chaptersData);
      } else {
        // Single chapter/quick write
        setWriteMode('quick');
        setStoryContent(story.content || '');
      }

    } catch (error) {
      console.error('Load story error:', error);
      Alert.alert('Hata', 'Hikaye yüklenirken bir hata oluştu.');
      router.back();
    } finally {
      setIsLoadingStory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Load story data
  useEffect(() => {
    if (!id || typeof id !== 'string') {
      router.back();
      return;
    }

    loadStoryData(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keyboard handling
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Auto-save functionality
  const handleAutoSave = React.useCallback(async () => {
    if (!currentUser?.id || !storyData?.id || (!storyTitle.trim() && !storyContent.trim())) return;

    setAutoSaveStatus('saving');
    // Simulate auto-save (you can implement actual save logic here)
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 2000);
    }, 1000);
  }, [currentUser?.id, storyTitle, storyContent, storyData?.id]);

  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (storyTitle.trim() || storyContent.trim()) {
        handleAutoSave();
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [storyTitle, storyContent, handleAutoSave]);

  // Animation helpers for labels
  const animateLabel = useCallback((animValue: Animated.Value, toValue: number) => {
    Animated.timing(animValue, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, []);

  // Update label animations when content changes
  useEffect(() => {
    if (storyTitle.trim()) {
      animateLabel(titleLabelAnim, 1);
    }
  }, [storyTitle, titleLabelAnim, animateLabel]);

  useEffect(() => {
    if (storyContent.trim()) {
      animateLabel(contentLabelAnim, 1);
    }
  }, [storyContent, contentLabelAnim, animateLabel]);

  useEffect(() => {
    if (storyDescription.trim()) {
      animateLabel(descriptionLabelAnim, 1);
    }
  }, [storyDescription, descriptionLabelAnim, animateLabel]);

  // Update chapter label animations when chapter changes
  useEffect(() => {
    const currentChap = chapters[currentChapterIndex];
    if (currentChap?.title?.trim()) {
      animateLabel(chapterTitleLabelAnim, 1);
    } else {
      animateLabel(chapterTitleLabelAnim, 0);
    }
    if (currentChap?.content?.trim()) {
      animateLabel(chapterContentLabelAnim, 1);
    } else {
      animateLabel(chapterContentLabelAnim, 0);
    }
  }, [currentChapterIndex, chapters, chapterTitleLabelAnim, chapterContentLabelAnim, animateLabel]);

  // Clear focus when navigating away from this tab
  useFocusEffect(
    useCallback(() => {
      return () => {
        // This runs when leaving the tab
        Keyboard.dismiss();
        setFocusedInput(null);
      };
    }, [])
  );

  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  // Quick validation
  const getQuickFormValidation = () => {
    return {
      isValid: storyTitle.trim().length >= 3 && storyContent.trim().length >= 50,
      titleValid: storyTitle.trim().length >= 3,
      contentValid: storyContent.trim().length >= 50,
    };
  };

  // Word count helper
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Reading time helper
  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const wordCount = getWordCount(text);
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !storyTags.includes(newTag.trim()) && storyTags.length < 5) {
      setStoryTags([...storyTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setStoryTags(storyTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddContentWarning = (warning: string) => {
    if (!contentWarnings.includes(warning)) {
      setContentWarnings([...contentWarnings, warning]);
    }
  };

  const handleRemoveContentWarning = (warningToRemove: string) => {
    setContentWarnings(contentWarnings.filter(warning => warning !== warningToRemove));
  };

  const calculateReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const calculateTotalReadingTime = (): number => {
    return chapters.reduce((total, chapter) => total + calculateReadingTime(chapter.content), 0);
  };

  const handlePickCoverImage = async () => {
    try {
      const imageUri = await imageUploadService.pickImageFromGallery();
      if (imageUri) {
        setCoverImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Resim seçilirken bir hata oluştu.');
    }
  };

  const handleTakeCoverPhoto = async () => {
    try {
      const imageUri = await imageUploadService.takePhotoWithCamera();
      if (imageUri) {
        setCoverImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  // Chapter management functions
  const handleAddChapter = () => {
    const newChapterNumber = chapters.length + 1;
    const newChapter = {
      id: Date.now().toString(),
      title: `Bölüm ${newChapterNumber}`,
      content: '',
      isPublished: false,
    };
    setChapters([...chapters, newChapter]);
    setCurrentChapterIndex(chapters.length);
  };

  const handleUpdateChapter = (index: number, field: 'title' | 'content', value: string) => {
    const updatedChapters = [...chapters];
    updatedChapters[index] = { ...updatedChapters[index], [field]: value };
    setChapters(updatedChapters);
  };

  const handleDeleteChapter = (index: number) => {
    if (chapters.length > 1) {
      const updatedChapters = chapters.filter((_, i) => i !== index);
      setChapters(updatedChapters);
      if (currentChapterIndex >= index) {
        setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1));
      }
    }
  };

  // Mode change with animation
  const handleModeChange = (mode: 'quick' | 'advanced') => {
    // Clear focus when switching modes
    Keyboard.dismiss();
    setFocusedInput(null);

    Animated.timing(modeTabAnim, {
      toValue: mode === 'quick' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setWriteMode(mode);
  };

  // Input focus/blur handlers
  const handleInputFocus = (inputName: string, animValue: Animated.Value) => {
    setFocusedInput(inputName);
    animateLabel(animValue, 1);
  };

  const handleInputBlur = (inputName: string, animValue: Animated.Value, value: string) => {
    setFocusedInput(null);
    if (!value.trim()) {
      animateLabel(animValue, 0);
    }
  };

  const handleUpdateStory = async () => {
    if (!currentUser?.id || !storyData?.id) {
      Alert.alert('Hata', 'Hikaye güncellenirken bir hata oluştu.');
      return;
    }

    const validation = getQuickFormValidation();
    if (!validation.isValid) {
      if (!validation.titleValid) {
        Alert.alert('Başlık Eksik', 'Hikaye başlığı en az 3 karakter olmalıdır.');
        return;
      }
      if (!validation.contentValid) {
        Alert.alert('İçerik Eksik', 'Hikaye içeriği en az 50 karakter olmalıdır.');
        return;
      }
    }

    try {
      // Upload cover image if exists and changed
      let coverImageUrl: string | undefined = coverImage || undefined;
      if (coverImage && !coverImage.startsWith('http') && !coverImage.startsWith('data:')) {
        try {
          coverImageUrl = await imageUploadService.uploadBookCover(storyData.id, coverImage);
        } catch (error) {
          console.error('Cover image upload error:', error);
          coverImageUrl = storyData.coverImage; // Keep original if upload fails
        }
      }

      // Bölümler write.tsx ile aynı benzersiz ayraçla birleştirilir; \n\n
      // kullanmak okuyucudaki bölüm sınırlarını bozuyordu.
      const content = writeMode === 'quick'
        ? storyContent
        : chapters.map(ch => ch.content).join('\n§§\n');

      const updateData: any = {
        title: storyTitle.trim(),
        description: storyDescription.trim() || storyContent.substring(0, 200) + '...',
        content,
        category: storyCategory,
        tags: storyTags,
        isCompleted,
        chaptersCount: writeMode === 'quick' ? 1 : chapters.length,
        readingTime: getReadingTime(content),
        isBook: writeMode === 'advanced' && chapters.length > 1,
      };

      // Add optional fields only if they exist
      if (coverImageUrl) updateData.coverImage = coverImageUrl;
      if (targetAudience) updateData.targetAudience = targetAudience;
      if (language) updateData.language = language;
      if (contentWarnings && contentWarnings.length > 0) updateData.contentWarnings = contentWarnings;
      if (writeMode === 'advanced' && chapters.length > 1) {
        updateData.chapterTitles = chapters.map(ch => ch.title);
      }

      const result = await storyActions.updateStory(storyData.id, updateData);

      if (result.success) {
        setAutoSaveStatus('saved');
        Alert.alert(
          '✅ Başarılı',
          'Hikayen başarıyla güncellendi.',
          [
            {
              text: 'Profili Gör',
              onPress: () => router.push('/(tabs)/profile'),
            },
            {
              text: 'Geri Dön',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('❌ Hata', result.error || 'Hikaye güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Update story error:', error);
      Alert.alert('❌ Hata', 'Hikaye güncellenirken bir hata oluştu.');
    }
  };

  return {
    // navigation
    router,
    // loading / data
    isLoading,
    isLoadingStory,
    storyData,
    // mode
    writeMode,
    showAdvancedOptions,
    toggleAdvancedOptions,
    keyboardHeight,
    focusedInput,
    // core fields
    storyTitle,
    setStoryTitle,
    storyContent,
    setStoryContent,
    storyCategory,
    setStoryCategory,
    // animations
    modeTabAnim,
    titleLabelAnim,
    contentLabelAnim,
    descriptionLabelAnim,
    chapterTitleLabelAnim,
    chapterContentLabelAnim,
    // advanced fields
    storyDescription,
    setStoryDescription,
    storyTags,
    newTag,
    setNewTag,
    coverImage,
    isCompleted,
    setIsCompleted,
    targetAudience,
    setTargetAudience,
    language,
    setLanguage,
    contentWarnings,
    // chapters
    chapters,
    currentChapterIndex,
    setCurrentChapterIndex,
    // cover modal
    showCoverModal,
    setShowCoverModal,
    // auto save
    autoSaveStatus,
    // constant options
    categories,
    targetAudiences,
    languages,
    commonContentWarnings,
    // derived helpers
    getQuickFormValidation,
    getWordCount,
    getReadingTime,
    calculateReadingTime,
    calculateTotalReadingTime,
    // actions
    handleAddTag,
    handleRemoveTag,
    handleAddContentWarning,
    handleRemoveContentWarning,
    handlePickCoverImage,
    handleTakeCoverPhoto,
    handleAddChapter,
    handleUpdateChapter,
    handleDeleteChapter,
    handleModeChange,
    handleInputFocus,
    handleInputBlur,
    handleUpdateStory,
  };
}
