import { Colors } from '@/constants/Colors';
import { imageUploadService } from '@/services/imageUploadService';
import { authState$ } from '@/store/authStore';
import { storyActions, storyState$ } from '@/store/storyStore';
import { StoryCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { Screen } from '@/components/ui';

export default observer(function StoryEditScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user: currentUser } = authState$.get();
  const { isLoading } = storyState$.get();
  
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
  const [chapters, setChapters] = useState<{ id: string; title: string; content: string; isPublished: boolean }[]>([
    { id: '1', title: 'Bölüm 1', content: '', isPublished: false }
  ]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // UI state
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  const styles = createStyles(colors);

  // Load story data
  useEffect(() => {
    if (!id || typeof id !== 'string') {
      router.back();
      return;
    }
    
    loadStoryData(id);
  }, [id]);

  const loadStoryData = async (storyId: string) => {
    try {
      setIsLoadingStory(true);
      
      // Get story from store or fetch from API
      const stories = storyState$.stories.get();
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
  };

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

  // Update label animations when content changes
  useEffect(() => {
    if (storyTitle.trim()) {
      animateLabel(titleLabelAnim, 1);
    }
  }, [storyTitle, titleLabelAnim]);

  useEffect(() => {
    if (storyContent.trim()) {
      animateLabel(contentLabelAnim, 1);
    }
  }, [storyContent, contentLabelAnim]);

  useEffect(() => {
    if (storyDescription.trim()) {
      animateLabel(descriptionLabelAnim, 1);
    }
  }, [storyDescription, descriptionLabelAnim]);

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
  }, [currentChapterIndex, chapters, chapterTitleLabelAnim, chapterContentLabelAnim]);

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

  const categories: { value: StoryCategory; label: string }[] = [
    { value: 'romance', label: 'Romantik' },
    { value: 'fantasy', label: 'Fantastik' },
    { value: 'mystery', label: 'Gizem' },
    { value: 'drama', label: 'Drama' },
    { value: 'adventure', label: 'Macera' },
    { value: 'horror', label: 'Korku' },
    { value: 'comedy', label: 'Komedi' },
    { value: 'poetry', label: 'Şiir' },
    { value: 'other', label: 'Diğer' },
  ];

  const targetAudiences = [
    { value: 'all', label: 'Herkes' },
    { value: 'teen', label: 'Gençler (13-17)' },
    { value: 'adult', label: 'Yetişkinler (18+)' },
  ];

  const languages = [
    'Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca',
    'İtalyanca', 'Rusça', 'Japonca', 'Korece', 'Çince',
  ];

  const commonContentWarnings = [
    'Şiddet', 'Cinsel İçerik', 'Küfür', 'Madde Kullanımı',
    'Kendine Zarar Verme', 'Yeme Bozuklukları', 'Irkçılık',
    'Homofobi', 'Transfobi', 'Hayvan Zararı',
  ];

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

  // Animation helpers for labels
  const animateLabel = (animValue: Animated.Value, toValue: number) => {
    Animated.timing(animValue, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
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

  const validation = getQuickFormValidation();
  const currentChapter = chapters[currentChapterIndex];
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // Show loading screen while fetching story
  if (isLoadingStory) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Hikaye yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  // If no story data, show error
  if (!storyData) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Hikaye bulunamadı</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // Render Quick Write Mode
  const renderQuickWriteMode = () => (
    <View style={styles.quickWriteContainer}>
      {/* Write Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <Text style={styles.modeToggleLabel}>Yazma Modu</Text>
        <View style={styles.modeToggle}>
          <Animated.View 
            style={[
              styles.modeToggleSlider,
              {
                transform: [{
                  translateX: modeTabAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (screenWidth - 40) * 0.5 - 4], // Exact half position
                  })
                }]
              }
            ]}
          />
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => handleModeChange('quick')}
          >
            <Ionicons 
              name="create-outline" 
              size={16} 
              color={writeMode === 'quick' ? colors.white : colors.textSecondary} 
            />
            <Text style={[
              styles.modeButtonText,
              writeMode === 'quick' && styles.modeButtonTextActive
            ]}>
              Hızlı Yaz
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => handleModeChange('advanced')}
          >
            <Ionicons 
              name="library-outline" 
              size={16} 
              color={writeMode === 'advanced' ? colors.white : colors.textSecondary} 
            />
            <Text style={[
              styles.modeButtonText,
              writeMode === 'advanced' && styles.modeButtonTextActive
            ]}>
              Detaylı
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cover Image Section - moved to main UI */}
      <View style={styles.coverSection}>
        <Text style={styles.coverSectionLabel}>📷 Hikaye Kapağı</Text>
          <TouchableOpacity
          style={styles.coverSelectButton}
            onPress={() => setShowCoverModal(true)}
          >
            {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverThumbnail} />
            ) : (
              <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.coverPlaceholderText}>Kapak Ekle</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

            {/* Title Input with animated floating label */}
      <View style={styles.floatingInputContainer}>
        <Animated.Text 
          style={[
            styles.floatingLabel,
            {
              top: titleLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, -8],
              }),
              fontSize: titleLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: titleLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.textSecondary, colors.primary],
              }),
              backgroundColor: titleLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.background],
              }),
            }
          ]}
        >
          Hikaye Başlığı
        </Animated.Text>
          <TextInput
          style={[
            styles.titleInput,
            focusedInput === 'title' && styles.inputFocused,
            !validation.titleValid && storyTitle.length > 0 && styles.inputError
          ]}
            value={storyTitle}
            onChangeText={setStoryTitle}
          onFocus={() => handleInputFocus('title', titleLabelAnim)}
          onBlur={() => handleInputBlur('title', titleLabelAnim, storyTitle)}
          placeholder=""
          placeholderTextColor={colors.textSecondary}
            maxLength={100}
          />
        <View style={styles.inputMeta}>
          <Text style={[
            styles.inputValidation,
            validation.titleValid ? styles.validationSuccess : styles.validationError
          ]}>
            {storyTitle.length >= 3 ? '✓ Başlık uygun' : 'En az 3 karakter gerekli'}
          </Text>
          <Text style={styles.characterCount}>{storyTitle.length}/100</Text>
        </View>
        </View>

            {/* Content Input with animated floating label */}
      <View style={[styles.floatingInputContainer, { flex: 1 }]}>
        <Animated.Text 
          style={[
            styles.floatingLabel,
            {
              top: contentLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [22, -8],
              }),
              fontSize: contentLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: contentLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.textSecondary, colors.primary],
              }),
              backgroundColor: contentLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.background],
              }),
            }
          ]}
        >
          Hikayeni Yaz
        </Animated.Text>
        <TextInput
          style={[
            styles.contentInput,
            focusedInput === 'content' && styles.inputFocused,
            !validation.contentValid && storyContent.length > 0 && styles.inputError,
            { height: Math.max(200, screenHeight * 0.3 - keyboardHeight / 2) }
          ]}
          value={storyContent}
          onChangeText={setStoryContent}
          onFocus={() => handleInputFocus('content', contentLabelAnim)}
          onBlur={() => handleInputBlur('content', contentLabelAnim, storyContent)}
          placeholder=""
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
        />
        <View style={styles.inputMeta}>
          <View style={styles.contentStats}>
            <Text style={styles.statText}>
              📝 {getWordCount(storyContent)} kelime
            </Text>
            <Text style={styles.statText}>
              ⏱️ {getReadingTime(storyContent)} dk okuma
            </Text>
          </View>
          <Text style={[
            styles.inputValidation,
            validation.contentValid ? styles.validationSuccess : styles.validationError
          ]}>
            {storyContent.length >= 50 ? '✓ İçerik yeterli' : `${50 - storyContent.length} karakter daha`}
          </Text>
        </View>
      </View>

      {/* Quick Category Selection */}
      <View style={styles.quickCategoryContainer}>
        <Text style={styles.quickCategoryLabel}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickCategoryScroll}>
          {categories.slice(0, 6).map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                styles.quickCategoryChip,
                storyCategory === cat.value && styles.quickCategoryChipActive
                ]}
                onPress={() => setStoryCategory(cat.value)}
              >
                <Text style={[
                styles.quickCategoryChipText,
                storyCategory === cat.value && styles.quickCategoryChipTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      {/* Advanced Options Toggle */}
              <TouchableOpacity
        style={styles.advancedToggle}
        onPress={toggleAdvancedOptions}
      >
        <Ionicons 
          name={showAdvancedOptions ? "chevron-up" : "options"} 
          size={20} 
          color={colors.primary} 
        />
        <Text style={styles.advancedToggleText}>
          {showAdvancedOptions ? 'Gelişmiş Seçenekleri Gizle' : 'Gelişmiş Seçenekler'}
                </Text>
              </TouchableOpacity>
        </View>
  );

  // Render Advanced Write Mode
  const renderAdvancedWriteMode = () => (
    <View style={styles.advancedWriteContainer}>
      {/* Write Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <Text style={styles.modeToggleLabel}>Yazma Modu</Text>
        <View style={styles.modeToggle}>
          <Animated.View 
                style={[
              styles.modeToggleSlider,
              {
                transform: [{
                  translateX: modeTabAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (screenWidth - 40) * 0.5 - 4], // Exact half position
                  })
                }]
              }
            ]}
          />
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => handleModeChange('quick')}
          >
            <Ionicons 
              name="create-outline" 
              size={16} 
              color={writeMode === 'quick' ? colors.white : colors.textSecondary} 
            />
                <Text style={[
              styles.modeButtonText,
              writeMode === 'quick' && styles.modeButtonTextActive
                ]}>
              Hızlı Yaz
                </Text>
              </TouchableOpacity>
            <TouchableOpacity
            style={styles.modeButton}
            onPress={() => handleModeChange('advanced')}
          >
            <Ionicons 
              name="library-outline" 
              size={16} 
              color={writeMode === 'advanced' ? colors.white : colors.textSecondary} 
            />
            <Text style={[
              styles.modeButtonText,
              writeMode === 'advanced' && styles.modeButtonTextActive
            ]}>
              Detaylı
            </Text>
            </TouchableOpacity>
        </View>
          </View>
          
      {/* Cover Image Section */}
      <View style={styles.coverSection}>
        <Text style={styles.coverSectionLabel}>📷 Hikaye Kapağı</Text>
                  <TouchableOpacity
          style={styles.coverSelectButton}
          onPress={() => setShowCoverModal(true)}
        >
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverThumbnail} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.coverPlaceholderText}>Kapak Ekle</Text>
            </View>
          )}
        </TouchableOpacity>
        </View>

      {/* Title Input with animated floating label */}
      <View style={styles.floatingInputContainer}>
        <Animated.Text 
          style={[
            styles.floatingLabel,
            {
              top: titleLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, -8],
              }),
              fontSize: titleLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: titleLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.textSecondary, colors.primary],
              }),
              backgroundColor: titleLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.background],
              }),
            }
          ]}
        >
          Hikaye Başlığı
        </Animated.Text>
        <TextInput
          style={[
            styles.titleInput,
            focusedInput === 'title' && styles.inputFocused,
            !validation.titleValid && storyTitle.length > 0 && styles.inputError
          ]}
          value={storyTitle}
          onChangeText={setStoryTitle}
          onFocus={() => handleInputFocus('title', titleLabelAnim)}
          onBlur={() => handleInputBlur('title', titleLabelAnim, storyTitle)}
          placeholder=""
          placeholderTextColor={colors.textSecondary}
          maxLength={100}
        />
        <View style={styles.inputMeta}>
          <Text style={[
            styles.inputValidation,
            validation.titleValid ? styles.validationSuccess : styles.validationError
          ]}>
            {storyTitle.length >= 3 ? '✓ Başlık uygun' : 'En az 3 karakter gerekli'}
          </Text>
          <Text style={styles.characterCount}>{storyTitle.length}/100</Text>
        </View>
      </View>

            {/* Description Input with animated floating label */}
      <View style={styles.floatingInputContainer}>
        <Animated.Text 
          style={[
            styles.floatingLabel,
            {
              top: descriptionLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [22, -8],
              }),
              fontSize: descriptionLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: descriptionLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.textSecondary, colors.primary],
              }),
              backgroundColor: descriptionLabelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.background],
              }),
            }
          ]}
        >
          Hikaye Açıklaması
        </Animated.Text>
        <TextInput
          style={[
            styles.descriptionInput,
            focusedInput === 'description' && styles.inputFocused
          ]}
          value={storyDescription}
          onChangeText={setStoryDescription}
          onFocus={() => handleInputFocus('description', descriptionLabelAnim)}
          onBlur={() => handleInputBlur('description', descriptionLabelAnim, storyDescription)}
          placeholder=""
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>{storyDescription.length}/500</Text>
      </View>

        {/* Chapters Section */}
      <View style={styles.chaptersSection}>
        <View style={styles.chaptersSectionHeader}>
          <Text style={styles.chaptersSectionTitle}>📚 Bölümler</Text>
            <TouchableOpacity
            style={styles.addChapterBtn}
              onPress={handleAddChapter}
            >
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.addChapterBtnText}>Ekle</Text>
            </TouchableOpacity>
          </View>

          {/* Chapter Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chapterNavScroll}>
            {chapters.map((chapter, index) => (
              <TouchableOpacity
                key={chapter.id}
                style={[
                styles.chapterNavTab,
                currentChapterIndex === index && styles.chapterNavTabActive
                ]}
                onPress={() => setCurrentChapterIndex(index)}
              >
                <Text style={[
                styles.chapterNavTabText,
                currentChapterIndex === index && styles.chapterNavTabTextActive
                ]}>
                  {chapter.title}
                </Text>
                {chapters.length > 1 && (
                  <TouchableOpacity
                  style={styles.deleteChapterBtn}
                    onPress={() => handleDeleteChapter(index)}
                  >
                  <Ionicons name="close" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

                {/* Current Chapter Editor */}
        <View style={styles.chapterEditor}>
          <View style={styles.floatingInputContainer}>
            <Animated.Text 
              style={[
                styles.floatingLabel,
                {
                  top: chapterTitleLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, -8],
                  }),
                  fontSize: chapterTitleLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 12],
                  }),
                  color: chapterTitleLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.textSecondary, colors.primary],
                  }),
                  backgroundColor: chapterTitleLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['transparent', colors.background],
                  }),
                }
              ]}
            >
              Bölüm Başlığı
            </Animated.Text>
            <TextInput
              style={[
                styles.chapterTitleInput,
                focusedInput === 'chapterTitle' && styles.inputFocused
              ]}
              value={currentChapter.title}
              onChangeText={(value) => handleUpdateChapter(currentChapterIndex, 'title', value)}
              onFocus={() => handleInputFocus('chapterTitle', chapterTitleLabelAnim)}
              onBlur={() => handleInputBlur('chapterTitle', chapterTitleLabelAnim, currentChapter.title)}
              placeholder=""
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
          </View>

          <View style={[styles.floatingInputContainer, { flex: 1 }]}>
            <Animated.Text 
              style={[
                styles.floatingLabel,
                {
                  top: chapterContentLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, -8],
                  }),
                  fontSize: chapterContentLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 12],
                  }),
                  color: chapterContentLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.textSecondary, colors.primary],
                  }),
                  backgroundColor: chapterContentLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['transparent', colors.background],
                  }),
                }
              ]}
            >
              Bölüm İçeriği
            </Animated.Text>
            <TextInput
              style={[
                styles.chapterContentInput,
                focusedInput === 'chapterContent' && styles.inputFocused,
                { height: Math.max(200, screenHeight * 0.25) }
              ]}
              value={currentChapter.content}
              onChangeText={(value) => handleUpdateChapter(currentChapterIndex, 'content', value)}
              onFocus={() => handleInputFocus('chapterContent', chapterContentLabelAnim)}
              onBlur={() => handleInputBlur('chapterContent', chapterContentLabelAnim, currentChapter.content)}
              placeholder=""
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.inputMeta}>
              <View style={styles.contentStats}>
                <Text style={styles.statText}>
                  📝 {getWordCount(currentChapter.content)} kelime
                </Text>
                <Text style={styles.statText}>
                  ⏱️ {getReadingTime(currentChapter.content)} dk okuma
                </Text>
                <Text style={styles.statText}>
                  📚 Toplam: {calculateTotalReadingTime()} dk
                </Text>
              </View>
            </View>
          </View>
        </View>
        </View>

      {/* Categories and Settings */}
      <View style={styles.quickCategoryContainer}>
        <Text style={styles.quickCategoryLabel}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickCategoryScroll}>
          {categories.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.quickCategoryChip,
                storyCategory === cat.value && styles.quickCategoryChipActive
              ]}
              onPress={() => setStoryCategory(cat.value)}
            >
              <Text style={[
                styles.quickCategoryChipText,
                storyCategory === cat.value && styles.quickCategoryChipTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
            </View>

      {/* Advanced Options Toggle */}
      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={toggleAdvancedOptions}
      >
        <Ionicons 
          name={showAdvancedOptions ? "chevron-up" : "options"} 
          size={20} 
          color={colors.primary} 
        />
        <Text style={styles.advancedToggleText}>
          {showAdvancedOptions ? 'Gelişmiş Seçenekleri Gizle' : 'Gelişmiş Seçenekler'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen style={styles.container}>
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>✍️ Hikayeyi Düzenle</Text>
            </View>
            {autoSaveStatus && (
              <View style={styles.autoSaveIndicator}>
                {autoSaveStatus === 'saving' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons 
                    name={autoSaveStatus === 'saved' ? 'checkmark-circle' : 'alert-circle'} 
                    size={16} 
                    color={autoSaveStatus === 'saved' ? colors.success : colors.error} 
                  />
                )}
                <Text style={[
                  styles.autoSaveText,
                  { color: autoSaveStatus === 'saved' ? colors.success : autoSaveStatus === 'error' ? colors.error : colors.primary }
                ]}>
                  {autoSaveStatus === 'saving' ? 'Kaydediliyor...' : 
                   autoSaveStatus === 'saved' ? 'Kaydedildi' : 'Hata'}
              </Text>
            </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.updateButton, !validation.isValid && styles.actionButtonDisabled]}
              onPress={handleUpdateStory}
              disabled={!validation.isValid || isLoading}
            >
              <Ionicons name="checkmark-outline" size={16} color={colors.white} />
              <Text style={styles.actionButtonText}>Güncelle</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>

      {/* Main Content */}
      <ScrollView 
        style={[styles.scrollView, { paddingBottom: keyboardHeight }]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {writeMode === 'quick' ? renderQuickWriteMode() : renderAdvancedWriteMode()}

        {/* Advanced Options (when toggled) */}
        {showAdvancedOptions && (
          <View style={styles.advancedOptionsContainer}>
            
            {/* Tags Section */}
            <View style={styles.advancedSection}>
              <Text style={styles.advancedSectionTitle}>🏷️ Etiketler</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagAdvancedInput}
                  placeholder="Etiket ekle..."
                  placeholderTextColor={colors.textSecondary}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={handleAddTag}
                  maxLength={20}
                />
                <TouchableOpacity
                  style={[styles.tagAddButton, (!newTag.trim() || storyTags.length >= 5) && styles.tagAddButtonDisabled]}
                  onPress={handleAddTag}
                  disabled={!newTag.trim() || storyTags.length >= 5}
                >
                  <Ionicons name="add" size={18} color={colors.white} />
                </TouchableOpacity>
              </View>
              
              {storyTags.length > 0 && (
                <View style={styles.tagsDisplay}>
                  {storyTags.map((tag, index) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                      <TouchableOpacity
                        style={styles.tagRemoveButton}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <Ionicons name="close" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Target Audience */}
            <View style={styles.advancedSection}>
              <Text style={styles.advancedSectionTitle}>👥 Hedef Kitle</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {targetAudiences.map((audience) => (
                  <TouchableOpacity
                    key={audience.value}
                    style={[
                      styles.quickCategoryChip,
                      targetAudience === audience.value && styles.quickCategoryChipActive
                    ]}
                    onPress={() => setTargetAudience(audience.value as 'all' | 'teen' | 'adult')}
                  >
                    <Text style={[
                      styles.quickCategoryChipText,
                      targetAudience === audience.value && styles.quickCategoryChipTextActive
                    ]}>
                      {audience.label}
                    </Text>
                  </TouchableOpacity>
                ))}
      </ScrollView>
            </View>

            {/* Language Selection */}
            <View style={styles.advancedSection}>
              <Text style={styles.advancedSectionTitle}>🌍 Dil</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {languages.slice(0, 5).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.quickCategoryChip,
                      language === lang && styles.quickCategoryChipActive
                    ]}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text style={[
                      styles.quickCategoryChipText,
                      language === lang && styles.quickCategoryChipTextActive
                    ]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Content Warnings */}
            <View style={styles.advancedSection}>
              <Text style={styles.advancedSectionTitle}>⚠️ İçerik Uyarıları</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {commonContentWarnings.slice(0, 6).map((warning) => (
                  <TouchableOpacity
                    key={warning}
                    style={[
                      styles.quickCategoryChip,
                      contentWarnings.includes(warning) && styles.quickCategoryChipActive
                    ]}
                    onPress={() => {
                      if (contentWarnings.includes(warning)) {
                        handleRemoveContentWarning(warning);
                      } else {
                        handleAddContentWarning(warning);
                      }
                    }}
                  >
                    <Text style={[
                      styles.quickCategoryChipText,
                      contentWarnings.includes(warning) && styles.quickCategoryChipTextActive
                    ]}>
                      {warning}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Completion Toggle */}
            <View style={styles.advancedSection}>
              <TouchableOpacity
                style={styles.completionAdvancedToggle}
                onPress={() => setIsCompleted(!isCompleted)}
              >
                <Ionicons 
                  name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={isCompleted ? colors.success : colors.textSecondary} 
                />
                <View style={styles.completionAdvancedContent}>
                  <Text style={[styles.completionAdvancedTitle, isCompleted && styles.completionAdvancedTitleActive]}>
                    Hikaye Tamamlandı
                  </Text>
                  <Text style={styles.completionAdvancedSubtitle}>
                    {isCompleted ? 'Hikaye artık tamamlanmış olarak işaretlendi' : 'Hikaye henüz devam ediyor'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modern Cover Image Modal */}
      <Modal
        visible={showCoverModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCoverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modernModalContent}>
            <Text style={styles.modernModalTitle}>📷 Kapak Resmi Ekle</Text>
            <Text style={styles.modernModalSubtitle}>
              Hikayen için görsel bir kapak seç
            </Text>
            
            <View style={styles.modalActions}>
            <TouchableOpacity
                style={styles.modernModalButton}
                onPress={() => {
                  setShowCoverModal(false);
                  handlePickCoverImage();
                }}
              >
                <View style={styles.modalButtonIcon}>
                  <Ionicons name="images" size={24} color={colors.primary} />
                </View>
                <View style={styles.modalButtonContent}>
                  <Text style={styles.modernModalButtonText}>Galeriden Seç</Text>
                  <Text style={styles.modernModalButtonSubtext}>Mevcut fotoğraflarından seç</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
              
            <TouchableOpacity
                style={styles.modernModalButton}
                onPress={() => {
                  setShowCoverModal(false);
                  handleTakeCoverPhoto();
                }}
              >
                <View style={styles.modalButtonIcon}>
                  <Ionicons name="camera" size={24} color={colors.primary} />
                </View>
                <View style={styles.modalButtonContent}>
                  <Text style={styles.modernModalButtonText}>Fotoğraf Çek</Text>
                  <Text style={styles.modernModalButtonSubtext}>Yeni bir fotoğraf çek</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.modernModalCancelButton}
              onPress={() => setShowCoverModal(false)}
            >
              <Text style={styles.modernModalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modern Loading Overlay */}
      {isLoading && (
        <View style={styles.modernLoadingOverlay}>
          <View style={styles.modernLoadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.modernLoadingText}>Hikayen güncelleniyor...</Text>
            <Text style={styles.modernLoadingSubtext}>Bu işlem birkaç saniye sürebilir</Text>
          </View>
        </View>
      )}
    </Screen>
  );
});

const createStyles = (colors: any) =>
  StyleSheet.create({
    // Base Layout
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    bottomSpacer: {
      height: 100,
    },
    
    // Loading states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    loadingText: {
      fontSize: 16,
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 18,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 20,
    },

    // Modern Header
    modernHeader: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingTop: 8,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerLeft: {
      flex: 1,
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    backButton: {
      padding: 4,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    autoSaveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    autoSaveText: {
      fontSize: 12,
      fontWeight: '500',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.white,
    },
    updateButton: {
      backgroundColor: colors.primary,
    },

    // Quick Write Mode
    quickWriteContainer: {
      flex: 1,
      paddingTop: 20,
    },
    advancedWriteContainer: {
      flex: 1,
      paddingTop: 20,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 50,
    },

    // Mode Toggle
    modeToggleContainer: {
      marginBottom: 24,
    },
    modeToggleLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    modeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      position: 'relative',
    },
    modeToggleSlider: {
      position: 'absolute',
      top: 4,
      left: 4,
      width: '48%',
      height: 36,
      backgroundColor: colors.primary,
      borderRadius: 8,
      zIndex: 1,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
      zIndex: 2,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modeButtonTextActive: {
      color: colors.white,
    },

    // Cover Section
    coverSection: {
      marginBottom: 20,
    },
    coverSectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    coverSelectButton: {
      alignSelf: 'center',
      borderRadius: 12,
      overflow: 'hidden',
    },
    coverThumbnail: {
      width: 80,
      height: 100,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    coverPlaceholder: {
      width: 80,
      height: 100,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    coverPlaceholderText: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Floating Input Containers
    floatingInputContainer: {
      marginBottom: 20,
      position: 'relative',
    },
    floatingLabel: {
      position: 'absolute',
      left: 12,
      fontSize: 16,
      color: colors.textSecondary,
      paddingHorizontal: 4,
      zIndex: 10,
      pointerEvents: 'none',
      fontWeight: '500',
    },

    // Input Styles
    titleInput: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      paddingTop: 18,
      paddingBottom: 18,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      minHeight: 56,
    },
    contentInput: {
      fontSize: 16,
      color: colors.text,
      paddingTop: 22,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      textAlignVertical: 'top',
      lineHeight: 24,
    },
    descriptionInput: {
      fontSize: 16,
      color: colors.text,
      paddingTop: 22,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      textAlignVertical: 'top',
      lineHeight: 20,
      minHeight: 100,
    },
    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    inputError: {
      borderColor: colors.error,
    },

    // Input Meta Information
    inputMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    inputValidation: {
      fontSize: 12,
      fontWeight: '500',
    },
    validationSuccess: {
      color: colors.success,
    },
    validationError: {
      color: colors.error,
    },
    characterCount: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Content Stats
    contentStats: {
      flexDirection: 'row',
      gap: 16,
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Quick Category
    quickCategoryContainer: {
      marginBottom: 20,
    },
    quickCategoryLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    quickCategoryScroll: {
      marginHorizontal: -4,
    },
    quickCategoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 4,
    },
    quickCategoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    quickCategoryChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    quickCategoryChipTextActive: {
      color: colors.white,
    },

    // Advanced Options Toggle
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      marginBottom: 20,
    },
    advancedToggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },

    // Chapters Section
    chaptersSection: {
      marginBottom: 20,
    },
    chaptersSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    chaptersSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    addChapterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    addChapterBtnText: {
      fontSize: 12,
      color: colors.white,
      fontWeight: '600',
    },
    chapterNavScroll: {
      marginBottom: 16,
    },
    chapterNavTab: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      gap: 6,
    },
    chapterNavTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chapterNavTabText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    chapterNavTabTextActive: {
      color: colors.white,
    },
    deleteChapterBtn: {
      padding: 2,
    },
    chapterEditor: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    chapterTitleInput: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      paddingTop: 18,
      paddingBottom: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      minHeight: 48,
    },
    chapterContentInput: {
      fontSize: 16,
      color: colors.text,
      paddingTop: 22,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      textAlignVertical: 'top',
      lineHeight: 24,
    },

    // Advanced Options Container
    advancedOptionsContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    advancedSection: {
      marginBottom: 24,
    },
    advancedSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },

    // Advanced Tags
    tagInputContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    tagAdvancedInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagAddButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagAddButtonDisabled: {
      opacity: 0.5,
    },
    tagsDisplay: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 4,
    },
    tagChipText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    tagRemoveButton: {
      padding: 2,
    },

    // Advanced Completion
    completionAdvancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    completionAdvancedContent: {
      flex: 1,
    },
    completionAdvancedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    completionAdvancedTitleActive: {
      color: colors.success,
    },
    completionAdvancedSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Modern Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modernModalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modernModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    modernModalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    modalActions: {
      gap: 12,
      marginBottom: 20,
    },
    modernModalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    modalButtonIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonContent: {
      flex: 1,
    },
    modernModalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    modernModalButtonSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    modernModalCancelButton: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    modernModalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    // Modern Loading
    modernLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modernLoadingContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      minWidth: 200,
    },
    modernLoadingText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    modernLoadingSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
  });