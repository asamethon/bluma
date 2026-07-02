import { useTheme } from '@/constants/theme';
import { StoryCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EditChapter } from '../hooks/useEditStoryForm';
import { AnimatedFloatingInput } from './AnimatedFloatingInput';
import { createSharedStyles } from './editSharedStyles';
import { EditChaptersSection } from './EditChaptersSection';
import { createStyles } from './EditAdvancedWriteForm.styles';
import { EditCoverSection } from './EditCoverSection';
import { EditModeToggle } from './EditModeToggle';

interface EditAdvancedWriteFormProps {
  writeMode: 'quick' | 'advanced';
  modeTabAnim: Animated.Value;
  onModeChange: (mode: 'quick' | 'advanced') => void;
  coverImage: string | null;
  showCoverModal: boolean;
  setShowCoverModal: (show: boolean) => void;
  onPickCoverImage: () => void;
  onTakeCoverPhoto: () => void;
  storyTitle: string;
  setStoryTitle: (value: string) => void;
  titleLabelAnim: Animated.Value;
  storyDescription: string;
  setStoryDescription: (value: string) => void;
  descriptionLabelAnim: Animated.Value;
  focusedInput: string | null;
  onInputFocus: (inputName: string, animValue: Animated.Value) => void;
  onInputBlur: (inputName: string, animValue: Animated.Value, value: string) => void;
  validation: { isValid: boolean; titleValid: boolean; contentValid: boolean };
  chapters: EditChapter[];
  currentChapterIndex: number;
  setCurrentChapterIndex: (index: number) => void;
  onAddChapter: () => void;
  onUpdateChapter: (index: number, field: 'title' | 'content', value: string) => void;
  onDeleteChapter: (index: number) => void;
  chapterTitleLabelAnim: Animated.Value;
  chapterContentLabelAnim: Animated.Value;
  getWordCount: (text: string) => number;
  getReadingTime: (text: string) => number;
  calculateTotalReadingTime: () => number;
  categories: { value: StoryCategory; label: string }[];
  storyCategory: StoryCategory;
  setStoryCategory: (value: StoryCategory) => void;
  showAdvancedOptions: boolean;
  toggleAdvancedOptions: () => void;
}

// "Detaylı" (bölümlü) yazma modunun tüm form içeriği (renderAdvancedWriteMode'dan taşındı).
export function EditAdvancedWriteForm({
  writeMode,
  modeTabAnim,
  onModeChange,
  coverImage,
  showCoverModal,
  setShowCoverModal,
  onPickCoverImage,
  onTakeCoverPhoto,
  storyTitle,
  setStoryTitle,
  titleLabelAnim,
  storyDescription,
  setStoryDescription,
  descriptionLabelAnim,
  focusedInput,
  onInputFocus,
  onInputBlur,
  validation,
  chapters,
  currentChapterIndex,
  setCurrentChapterIndex,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
  chapterTitleLabelAnim,
  chapterContentLabelAnim,
  getWordCount,
  getReadingTime,
  calculateTotalReadingTime,
  categories,
  storyCategory,
  setStoryCategory,
  showAdvancedOptions,
  toggleAdvancedOptions,
}: EditAdvancedWriteFormProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const shared = createSharedStyles(colors);

  return (
    <View style={styles.advancedWriteContainer}>
      <EditModeToggle writeMode={writeMode} modeTabAnim={modeTabAnim} onModeChange={onModeChange} />

      <EditCoverSection
        coverImage={coverImage}
        showCoverModal={showCoverModal}
        setShowCoverModal={setShowCoverModal}
        onPickImage={onPickCoverImage}
        onTakePhoto={onTakeCoverPhoto}
      />

      {/* Title Input with animated floating label */}
      <AnimatedFloatingInput
        label="Hikaye Başlığı"
        value={storyTitle}
        onChangeText={setStoryTitle}
        animValue={titleLabelAnim}
        focused={focusedInput === 'title'}
        onFocus={() => onInputFocus('title', titleLabelAnim)}
        onBlur={() => onInputBlur('title', titleLabelAnim, storyTitle)}
        maxLength={100}
        isError={!validation.titleValid && storyTitle.length > 0}
        inputStyle={styles.titleInput}
        topExpanded={18}
        footer={
          <View style={shared.inputMeta}>
            <Text style={[
              shared.inputValidation,
              validation.titleValid ? shared.validationSuccess : shared.validationError
            ]}>
              {storyTitle.length >= 3 ? '✓ Başlık uygun' : 'En az 3 karakter gerekli'}
            </Text>
            <Text style={shared.characterCount}>{storyTitle.length}/100</Text>
          </View>
        }
      />

      {/* Description Input with animated floating label */}
      <AnimatedFloatingInput
        label="Hikaye Açıklaması"
        value={storyDescription}
        onChangeText={setStoryDescription}
        animValue={descriptionLabelAnim}
        focused={focusedInput === 'description'}
        onFocus={() => onInputFocus('description', descriptionLabelAnim)}
        onBlur={() => onInputBlur('description', descriptionLabelAnim, storyDescription)}
        multiline
        maxLength={500}
        inputStyle={styles.descriptionInput}
        topExpanded={22}
        footer={<Text style={shared.characterCount}>{storyDescription.length}/500</Text>}
      />

      {/* Chapters Section */}
      <EditChaptersSection
        chapters={chapters}
        currentChapterIndex={currentChapterIndex}
        setCurrentChapterIndex={setCurrentChapterIndex}
        onAddChapter={onAddChapter}
        onUpdateChapter={onUpdateChapter}
        onDeleteChapter={onDeleteChapter}
        focusedInput={focusedInput}
        onInputFocus={onInputFocus}
        onInputBlur={onInputBlur}
        chapterTitleLabelAnim={chapterTitleLabelAnim}
        chapterContentLabelAnim={chapterContentLabelAnim}
        getWordCount={getWordCount}
        getReadingTime={getReadingTime}
        calculateTotalReadingTime={calculateTotalReadingTime}
      />

      {/* Categories and Settings */}
      <View style={shared.quickCategoryContainer}>
        <Text style={shared.quickCategoryLabel}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={shared.quickCategoryScroll}>
          {categories.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                shared.quickCategoryChip,
                storyCategory === cat.value && shared.quickCategoryChipActive
              ]}
              onPress={() => setStoryCategory(cat.value)}
            >
              <Text style={[
                shared.quickCategoryChipText,
                storyCategory === cat.value && shared.quickCategoryChipTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Advanced Options Toggle */}
      <TouchableOpacity
        style={shared.advancedToggle}
        onPress={toggleAdvancedOptions}
      >
        <Ionicons
          name={showAdvancedOptions ? "chevron-up" : "options"}
          size={20}
          color={colors.primary}
        />
        <Text style={shared.advancedToggleText}>
          {showAdvancedOptions ? 'Gelişmiş Seçenekleri Gizle' : 'Gelişmiş Seçenekler'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
